import axios from 'axios';
import { storage } from './storage';

// Interface for the retrieval results
interface RetrievalResult {
  text: string;
  source: string;
  score: number;
}

// Interface for the answer structure
interface AnswerResult {
  text: string;
  sources: string[];
  relatedObservationIds?: string[];
  relatedSpeciesIds?: string[];
}

/**
 * Create vector embeddings for a text - in a production app, 
 * we'd use a proper embedding model, but for simplicity we'll use
 * a basic implementation here
 */
function createEmbedding(text: string): number[] {
  // Simple TF-IDF-like approach using word frequencies
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  
  // Count word frequencies
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 2) { // Skip very short words
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Convert to a fixed-length vector (using hashing)
  const VECTOR_SIZE = 128;
  const embedding = new Array(VECTOR_SIZE).fill(0);
  
  Object.entries(wordFreq).forEach(([word, freq]) => {
    // Simple hash function to map words to vector positions
    const hashCode = Array.from(word).reduce(
      (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0);
    const position = Math.abs(hashCode) % VECTOR_SIZE;
    embedding[position] += freq;
  });
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
}

/**
 * Calculate similarity between two embeddings using cosine similarity
 */
function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }
  
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
  }
  
  return dotProduct; // Vectors are already normalized, so this is cosine similarity
}

/**
 * Retrieve relevant information from our knowledge base and observations
 */
async function retrieveRelevantInfo(query: string): Promise<RetrievalResult[]> {
  const queryEmbedding = createEmbedding(query);
  const results: RetrievalResult[] = [];
  
  try {
    // Get all knowledge entries
    const knowledgeEntries = await storage.getAllKnowledge();
    
    // Calculate similarity for each knowledge entry
    for (const entry of knowledgeEntries) {
      const contentEmbedding = createEmbedding(entry.title + ' ' + entry.content);
      const similarity = calculateSimilarity(queryEmbedding, contentEmbedding);
      
      if (similarity > 0.2) { // Only include if somewhat relevant
        results.push({
          text: entry.content,
          source: entry.source || 'Internal Knowledge Base',
          score: similarity
        });
      }
    }
    
    // Get species information
    const species = await storage.getAllSpecies();
    
    // Calculate similarity for each species
    for (const specie of species) {
      const speciesText = `${specie.scientificName} (${specie.commonNames.join(', ')}): ${specie.description}. Habitat: ${specie.habitat}. Type: ${specie.type}.`;
      const speciesEmbedding = createEmbedding(speciesText);
      const similarity = calculateSimilarity(queryEmbedding, speciesEmbedding);
      
      if (similarity > 0.2) {
        results.push({
          text: speciesText,
          source: `Species Database: ${specie.scientificName}`,
          score: similarity
        });
      }
    }
    
    // Get recent observations (limit to 50 for performance)
    const observations = await storage.getAllObservations();
    const recentObservations = observations.slice(0, 50);
    
    // Calculate similarity for recent observations
    for (const observation of recentObservations) {
      const obsText = `Observation of ${observation.speciesName} at coordinates [${observation.location.coordinates.join(', ')}]. ${observation.description || ''}`;
      const obsEmbedding = createEmbedding(obsText);
      const similarity = calculateSimilarity(queryEmbedding, obsEmbedding);
      
      if (similarity > 0.2) {
        results.push({
          text: obsText,
          source: `User Observation: ${observation.speciesName}`,
          score: similarity
        });
      }
    }
    
    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score).slice(0, 5);
  } catch (error) {
    console.error('Error retrieving information:', error);
    return [];
  }
}

/**
 * Search for information on the internet if no relevant local information is found
 */
async function searchInternet(query: string): Promise<RetrievalResult[]> {
  try {
    // Construct a search query relevant to Islamabad biodiversity
    const searchQuery = `${query} Islamabad Pakistan biodiversity flora fauna`;
    
    // For a real implementation, we could use a proper search API like Bing/Google/DuckDuckGo
    // Here we'll simulate results as we won't integrate with an actual search API
    
    // Simulate delay and return mock search results
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        text: `Information about ${query} in Islamabad region could be found in local guidebooks or by contacting the Islamabad Wildlife Management Board. The Margalla Hills National Park is home to diverse wildlife including various bird species, monkeys, and occasionally leopards.`,
        source: 'Internet Search Result (Note: Without internet access, this is general information)',
        score: 0.6
      }
    ];
  } catch (error) {
    console.error('Error searching internet:', error);
    return [];
  }
}

/**
 * Generate a response based on the retrieved context
 */
function generateResponse(query: string, retrievedInfo: RetrievalResult[]): string {
  if (retrievedInfo.length === 0) {
    return `I don't have specific information about ${query}. You might want to consult local experts or biodiversity guides specific to the Islamabad region.`;
  }
  
  // Combine retrieved information
  const context = retrievedInfo.map(info => info.text).join('\n\n');
  
  // In a real implementation, we'd use an LLM API here
  // For simplicity, we'll use a template-based approach
  
  try {
    // Extract key terms from the query
    const queryTerms = query.toLowerCase().split(/\s+/);
    const keyTerms = queryTerms.filter(term => term.length > 3);
    
    // Check if the query is about a specific species
    const isSpeciesQuery = queryTerms.some(term => 
      ['what', 'species', 'animal', 'plant', 'describe', 'identify'].includes(term)
    );
    
    // Check if the query is about location/habitat
    const isLocationQuery = queryTerms.some(term => 
      ['where', 'habitat', 'found', 'live', 'location', 'area', 'region'].includes(term)
    );
    
    // Check if query is about sightings or observations
    const isSightingQuery = queryTerms.some(term => 
      ['seen', 'spotted', 'observed', 'sighting', 'reported', 'found'].includes(term)
    );
    
    let response = '';
    
    if (isSpeciesQuery) {
      const speciesInfo = retrievedInfo.find(info => info.source.includes('Species Database'));
      if (speciesInfo) {
        response = `Based on our information: ${speciesInfo.text}\n\n`;
      } else {
        response = `I found some information that might help answer your question about species in Islamabad:\n\n`;
      }
    } else if (isLocationQuery) {
      response = `Regarding the habitat and location in Islamabad region:\n\n`;
    } else if (isSightingQuery) {
      const observations = retrievedInfo.filter(info => info.source.includes('User Observation'));
      if (observations.length > 0) {
        response = `Here are some relevant observations from our community:\n\n${observations.map(obs => `- ${obs.text}`).join('\n')}\n\n`;
      } else {
        response = `I couldn't find specific observations matching your query, but here's what I know:\n\n`;
      }
    } else {
      response = `Here's what I found about "${query}" related to Islamabad's biodiversity:\n\n`;
    }
    
    // Add the most relevant information if not already included
    if (!response.includes(retrievedInfo[0].text)) {
      response += retrievedInfo[0].text + '\n\n';
    }
    
    // Add additional context from other sources
    if (retrievedInfo.length > 1) {
      response += `Additional information:\n`;
      retrievedInfo.slice(1, 3).forEach(info => {
        response += `- ${info.text}\n`;
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return `I found some information about ${query}, but couldn't generate a proper response. Please try asking in a different way.`;
  }
}

/**
 * Main function to answer queries using RAG
 */
export async function answerWithRAG(query: string): Promise<AnswerResult> {
  try {
    // First try to retrieve information from our local database
    let retrievalResults = await retrieveRelevantInfo(query);
    
    // If local information is insufficient, search the internet
    if (retrievalResults.length < 2) {
      const internetResults = await searchInternet(query);
      retrievalResults = [...retrievalResults, ...internetResults];
    }
    
    // Generate the answer based on retrieved information
    const answerText = generateResponse(query, retrievalResults);
    
    // Extract the sources for citation
    const sources = retrievalResults.map(result => result.source);
    
    // Extract related observation and species IDs
    const relatedObservationIds: string[] = [];
    const relatedSpeciesIds: string[] = [];
    
    // Return the answer with metadata
    return {
      text: answerText,
      sources,
      relatedObservationIds,
      relatedSpeciesIds
    };
  } catch (error) {
    console.error('Error in RAG system:', error);
    return {
      text: 'Sorry, I encountered an error while processing your question. Please try again later.',
      sources: ['System Error']
    };
  }
}