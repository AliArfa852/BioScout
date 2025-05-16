import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
import fs from 'fs';
import path from 'path';

// Map of common MobileNet classes to more specific categories for our application
const classMap: { [key: string]: { type: 'plant' | 'animal' | 'fungi' | 'other', name: string } } = {
  // Animals
  'tiger cat': { type: 'animal', name: 'Domestic Cat' },
  'tabby': { type: 'animal', name: 'Domestic Cat' },
  'Egyptian cat': { type: 'animal', name: 'Domestic Cat' },
  'Persian cat': { type: 'animal', name: 'Domestic Cat' },
  'dog': { type: 'animal', name: 'Domestic Dog' },
  'fox': { type: 'animal', name: 'Red Fox' },
  'squirrel': { type: 'animal', name: 'Squirrel' },
  'rabbit': { type: 'animal', name: 'Wild Rabbit' },
  'hare': { type: 'animal', name: 'Wild Hare' },
  'hamster': { type: 'animal', name: 'Hamster' },
  'mongoose': { type: 'animal', name: 'Mongoose' },
  'red panda': { type: 'animal', name: 'Red Panda' },
  'monkey': { type: 'animal', name: 'Monkey' },
  'macaque': { type: 'animal', name: 'Macaque' },
  'baboon': { type: 'animal', name: 'Baboon' },
  'bee': { type: 'animal', name: 'Honey Bee' },
  'ant': { type: 'animal', name: 'Ant' },
  'butterfly': { type: 'animal', name: 'Butterfly' },
  'dragonfly': { type: 'animal', name: 'Dragonfly' },
  'ladybug': { type: 'animal', name: 'Ladybug' },
  'fly': { type: 'animal', name: 'Common Fly' },
  'grasshopper': { type: 'animal', name: 'Grasshopper' },
  'cricket': { type: 'animal', name: 'Cricket' },
  'mantis': { type: 'animal', name: 'Praying Mantis' },
  'lizard': { type: 'animal', name: 'Common Lizard' },
  'snake': { type: 'animal', name: 'Snake' },
  'bird': { type: 'animal', name: 'Bird' },
  'magpie': { type: 'animal', name: 'Magpie' },
  'chickadee': { type: 'animal', name: 'Chickadee' },
  'vulture': { type: 'animal', name: 'Vulture' },
  'eagle': { type: 'animal', name: 'Eagle' },
  'owl': { type: 'animal', name: 'Owl' },
  'bulbul': { type: 'animal', name: 'Bulbul' },
  'peacock': { type: 'animal', name: 'Peacock' },
  'sparrow': { type: 'animal', name: 'House Sparrow' },
  'frog': { type: 'animal', name: 'Frog' },
  'toad': { type: 'animal', name: 'Toad' },
  'turtle': { type: 'animal', name: 'Turtle' },
  
  // Plants
  'daisy': { type: 'plant', name: 'Daisy' },
  'dandelion': { type: 'plant', name: 'Dandelion' },
  'rose': { type: 'plant', name: 'Rose' },
  'sunflower': { type: 'plant', name: 'Sunflower' },
  'tulip': { type: 'plant', name: 'Tulip' },
  'poppy': { type: 'plant', name: 'Poppy' },
  'acorn': { type: 'plant', name: 'Oak Tree' },
  'buckeye': { type: 'plant', name: 'Buckeye Tree' },
  'corn': { type: 'plant', name: 'Corn' },
  'wheat': { type: 'plant', name: 'Wheat' },
  'broccoli': { type: 'plant', name: 'Broccoli' },
  'cauliflower': { type: 'plant', name: 'Cauliflower' },
  'cabbage': { type: 'plant', name: 'Cabbage' },
  'mushroom': { type: 'fungi', name: 'Mushroom' },
  
  // Fallback
  'default': { type: 'other', name: 'Unidentified Organism' }
};

// Plant specific keywords to filter results
const plantKeywords = ['plant', 'flower', 'tree', 'bush', 'shrub', 'herb', 'grass', 
  'leaf', 'leaves', 'petal', 'stem', 'root', 'seed', 'fruit', 'vegetable'];

// Animal specific keywords to filter results
const animalKeywords = ['animal', 'mammal', 'bird', 'reptile', 'amphibian', 'insect', 
  'fish', 'species', 'wildlife', 'creature', 'organism'];

let model: mobilenet.MobileNet | null = null;

/**
 * Load the MobileNet model - called once at server startup
 */
async function loadModel() {
  try {
    if (!model) {
      model = await mobilenet.load();
      console.log('MobileNet model loaded successfully');
    }
    return model;
  } catch (error) {
    console.error('Error loading MobileNet model:', error);
    throw new Error('Failed to load image recognition model');
  }
}

/**
 * Identifies species in an image using MobileNet
 */
export async function identifySpecies(imagePath: string): Promise<{ species: string, confidence: number, type: string }> {
  try {
    if (!model) {
      await loadModel();
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert the image to a tensor
    const tfImage = tf.node.decodeImage(imageBuffer);
    
    // Classify the image
    const predictions = await model!.classify(tfImage as tf.Tensor3D);
    
    // Dispose the tensor to free memory
    (tfImage as tf.Tensor).dispose();
    
    if (!predictions || predictions.length === 0) {
      return { 
        species: 'Unknown Species', 
        confidence: 0.1,
        type: 'other'
      };
    }
    
    console.log('Raw predictions:', predictions);
    
    // Get the top prediction with highest confidence
    const topPrediction = predictions[0];
    let className = topPrediction.className.toLowerCase();
    
    // Check if this is a common class we have mapped
    let mappedClass = null;
    
    // Try exact match first
    for (const key in classMap) {
      if (className.includes(key)) {
        mappedClass = classMap[key];
        break;
      }
    }
    
    // If no exact match, try to determine if it's a plant or animal based on keywords
    if (!mappedClass) {
      if (plantKeywords.some(keyword => className.includes(keyword))) {
        mappedClass = { type: 'plant', name: 'Unidentified Plant' };
      } else if (animalKeywords.some(keyword => className.includes(keyword))) {
        mappedClass = { type: 'animal', name: 'Unidentified Animal' };
      } else {
        mappedClass = classMap.default;
      }
    }
    
    return {
      species: mappedClass.name,
      confidence: topPrediction.probability,
      type: mappedClass.type
    };
    
  } catch (error) {
    console.error('Error identifying species:', error);
    return {
      species: 'Unknown Species',
      confidence: 0.1,
      type: 'other'
    };
  }
}

// Load the model when this module is imported
loadModel().catch(err => console.error('Initial model loading failed:', err));