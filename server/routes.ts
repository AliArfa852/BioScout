import { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';
import { identifySpecies } from './imageProcessor';
import { answerWithRAG } from './ragSystem';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up storage for multer (for image uploads)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // For now, a simple check. This would be replaced with proper JWT auth
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Here we'd typically validate the token and set user info in req.user
  // For now we'll just pass through for simplicity
  next();
}

// Calculate points for an observation based on uniqueness
async function calculatePoints(speciesName: string, location: any): Promise<number> {
  // Base points for any observation
  let points = 10;
  
  try {
    // Check if this species has been observed before
    const species = await storage.getSpecies(speciesName);
    
    if (!species) {
      // New species discovery gets more points
      points += 25;
    } else {
      // Check if this species has been observed in this area before
      const nearbyObservations = await storage.getObservationsNearLocation(
        location.coordinates[0],
        location.coordinates[1],
        1000 // 1km radius
      );
      
      const sameSpeciesNearby = nearbyObservations.filter(obs => 
        obs.speciesName.toLowerCase() === speciesName.toLowerCase()
      );
      
      if (sameSpeciesNearby.length === 0) {
        // First observation of this species in this area
        points += 15;
      }
    }
    
    return points;
  } catch (error) {
    console.error('Error calculating points:', error);
    return 10; // Default to base points on error
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // User routes
  app.post('/api/users/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      // Create new user
      const newUser = await storage.createUser({ username, email, password });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  });
  
  // These routes require authentication
  app.use('/api/observations', isAuthenticated);
  app.use('/api/species', isAuthenticated);
  app.use('/api/rag', isAuthenticated);
  
  // Observation routes
  app.get('/api/observations', async (req, res) => {
    try {
      const observations = await storage.getAllObservations();
      res.status(200).json(observations);
    } catch (error) {
      console.error('Error getting observations:', error);
      res.status(500).json({ message: 'Error getting observations' });
    }
  });
  
  app.get('/api/observations/:id', async (req, res) => {
    try {
      const observation = await storage.getObservation(req.params.id);
      
      if (!observation) {
        return res.status(404).json({ message: 'Observation not found' });
      }
      
      res.status(200).json(observation);
    } catch (error) {
      console.error('Error getting observation:', error);
      res.status(500).json({ message: 'Error getting observation' });
    }
  });
  
  app.post('/api/observations', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
      
      const { speciesName, commonNames, description, latitude, longitude } = req.body;
      const userId = req.headers.authorization; // In a real app, this would come from the JWT token
      
      // Process the image to identify the species if not provided
      let identifiedSpecies = speciesName;
      let confidence = 0.7; // Default confidence
      
      if (!speciesName) {
        const result = await identifySpecies(req.file.path);
        identifiedSpecies = result.species;
        confidence = result.confidence;
      }
      
      // Create location object for MongoDB
      const location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      
      // Calculate points based on uniqueness
      const points = await calculatePoints(identifiedSpecies, location);
      
      // Create the observation
      const newObservation = await storage.createObservation({
        userId,
        speciesName: identifiedSpecies,
        commonNames: commonNames ? JSON.parse(commonNames) : [],
        location,
        imageUrl: `/uploads/${req.file.filename}`,
        description: description || '',
        identificationConfidence: confidence,
        pointsAwarded: points
      });
      
      // Add points to user
      await storage.updateUserPoints(userId, points);
      
      // Check if we need to create a new species entry
      const existingSpecies = await storage.getSpecies(identifiedSpecies);
      if (!existingSpecies) {
        // Create a basic species entry that can be enriched later
        await storage.createSpecies({
          scientificName: identifiedSpecies,
          commonNames: commonNames ? JSON.parse(commonNames) : [],
          type: 'other', // We can't determine this automatically
          description: description || `Observed in Islamabad area`,
          habitat: 'Islamabad region',
          imageUrls: [`/uploads/${req.file.filename}`]
        });
      }
      
      res.status(201).json({ 
        ...newObservation, 
        message: `Observation recorded successfully! You earned ${points} points.` 
      });
    } catch (error) {
      console.error('Error creating observation:', error);
      res.status(500).json({ message: 'Error creating observation' });
    }
  });
  
  // Get observations near a location
  app.get('/api/observations/near/:longitude/:latitude/:distance?', async (req, res) => {
    try {
      const longitude = parseFloat(req.params.longitude);
      const latitude = parseFloat(req.params.latitude);
      const distance = req.params.distance ? parseInt(req.params.distance) : 1000; // Default 1km
      
      if (isNaN(longitude) || isNaN(latitude)) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }
      
      const observations = await storage.getObservationsNearLocation(longitude, latitude, distance);
      res.status(200).json(observations);
    } catch (error) {
      console.error('Error getting nearby observations:', error);
      res.status(500).json({ message: 'Error getting nearby observations' });
    }
  });
  
  // Species routes
  app.get('/api/species', async (req, res) => {
    try {
      const species = await storage.getAllSpecies();
      res.status(200).json(species);
    } catch (error) {
      console.error('Error getting species:', error);
      res.status(500).json({ message: 'Error getting species' });
    }
  });
  
  app.get('/api/species/:name', async (req, res) => {
    try {
      // Try to find by scientific name first
      let species = await storage.getSpecies(req.params.name);
      
      // If not found, try common name
      if (!species) {
        species = await storage.getSpeciesByCommonName(req.params.name);
      }
      
      if (!species) {
        return res.status(404).json({ message: 'Species not found' });
      }
      
      res.status(200).json(species);
    } catch (error) {
      console.error('Error getting species:', error);
      res.status(500).json({ message: 'Error getting species' });
    }
  });
  
  // RAG system routes
  app.post('/api/rag/ask', async (req, res) => {
    try {
      const { question } = req.body;
      const userId = req.headers.authorization; // In a real app, would come from JWT
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }
      
      // Use RAG system to answer the question
      const answer = await answerWithRAG(question);
      
      // Log the query
      await storage.createQuery({
        userId,
        question,
        answer: answer.text,
        relatedObservationIds: answer.relatedObservationIds || [],
        relatedSpeciesIds: answer.relatedSpeciesIds || [],
        sourcesUsed: answer.sources || []
      });
      
      res.status(200).json({
        question,
        answer: answer.text,
        sources: answer.sources
      });
    } catch (error) {
      console.error('Error processing RAG query:', error);
      res.status(500).json({ message: 'Error processing your question' });
    }
  });
  
  // Static files (for uploaded images)
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}