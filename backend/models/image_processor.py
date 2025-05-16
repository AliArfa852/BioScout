import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
from PIL import Image
import io
from typing import Dict, Any, Tuple, List, Optional

class ImageProcessor:
    """
    Image processor for the BioScout Islamabad application.
    Uses TensorFlow to identify species from images.
    """
    def __init__(self, db, model_path=None):
        self.db = db
        
        # Load model
        try:
            # If a custom model path is provided, use it
            if model_path and os.path.exists(model_path):
                self.model = tf.keras.models.load_model(model_path)
                self.using_custom_model = True
                print(f"Loaded custom model from {model_path}")
            else:
                # Otherwise, use MobileNetV2 pretrained model
                self.model = MobileNetV2(weights='imagenet')
                self.using_custom_model = False
                print("Loaded MobileNetV2 pretrained model")
                
            # Initialize mapping from ImageNet classes to our database species
            self.initialize_species_mapping()
            
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
    
    def initialize_species_mapping(self):
        """
        Initialize mapping from ImageNet classes to species in our database
        """
        self.species_mapping = {
            # Map ImageNet classes to species types
            'plant': ['plant', 'tree', 'flower', 'herb', 'grass', 'shrub', 'vine', 'moss', 'fern'],
            'animal': ['animal', 'bird', 'fish', 'mammal', 'insect', 'reptile', 'amphibian', 'dog', 'cat', 'horse', 
                       'monkey', 'fox', 'wolf', 'tiger', 'lion', 'bear', 'snake', 'lizard', 'turtle'],
            'fungi': ['fungus', 'mushroom'],
        }
        
        # Create reverse mapping for quick lookups
        self.class_to_type = {}
        for species_type, classes in self.species_mapping.items():
            for cls in classes:
                self.class_to_type[cls.lower()] = species_type
    
    def preprocess_image(self, img_data: bytes) -> np.ndarray:
        """
        Preprocess image for the model
        """
        try:
            # Open image from bytes
            img = Image.open(io.BytesIO(img_data))
            
            # Resize to the model's required input size
            img = img.resize((224, 224))
            
            # Convert to array and expand dimensions
            img_array = image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            
            # Preprocess for the model
            preprocessed_img = preprocess_input(img_array)
            
            return preprocessed_img
        
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            raise ValueError(f"Could not preprocess image: {str(e)}")
    
    def identify_species(self, img_data: bytes) -> Dict[str, Any]:
        """
        Identify species from an image
        Returns: Dict with identification results including species, type, confidence
        """
        if not self.model:
            raise ValueError("Model not initialized")
        
        # Preprocess image
        preprocessed_img = self.preprocess_image(img_data)
        
        # Predict
        predictions = self.model.predict(preprocessed_img)
        
        if self.using_custom_model:
            # Handle custom model predictions
            # This would be implemented based on our custom model's output format
            # For now, we'll use a placeholder implementation
            results = self._process_custom_model_predictions(predictions)
        else:
            # Process ImageNet model predictions
            decoded_preds = decode_predictions(predictions, top=5)[0]
            results = self._process_imagenet_predictions(decoded_preds)
        
        # Match with database species if possible
        enhanced_results = self._match_with_database(results)
        
        return enhanced_results
    
    def _process_imagenet_predictions(self, decoded_preds) -> Dict[str, Any]:
        """
        Process ImageNet model predictions and format results
        """
        # Extract top prediction
        top_pred = decoded_preds[0]
        pred_id, pred_class, confidence = top_pred
        
        # Determine species type
        species_type = "other"
        for class_name in self.class_to_type:
            if class_name in pred_class.lower():
                species_type = self.class_to_type[class_name]
                break
        
        # Format class name for display
        display_name = " ".join([word.capitalize() for word in pred_class.split("_")])
        
        return {
            "species": display_name,
            "type": species_type,
            "confidence": float(confidence),
            "alternatives": [
                {
                    "species": " ".join([word.capitalize() for word in pred[1].split("_")]),
                    "confidence": float(pred[2])
                }
                for pred in decoded_preds[1:4]  # Include top 3 alternatives
            ]
        }
    
    def _process_custom_model_predictions(self, predictions) -> Dict[str, Any]:
        """
        Process custom model predictions
        This is a placeholder - would be implemented based on our custom model
        """
        # Placeholder implementation - would be replaced with actual processing
        # of our custom model's output format
        
        # Assuming our custom model returns class indices with confidences
        top_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][top_class_idx])
        
        # Placeholder class labels - would be replaced with actual class labels
        class_labels = ["Unknown Species"]
        
        # In a real implementation, we'd have our own class labels and mapping
        species = class_labels[top_class_idx] if top_class_idx < len(class_labels) else "Unknown Species"
        
        return {
            "species": species,
            "type": "other",
            "confidence": confidence,
            "alternatives": []
        }
    
    def _match_with_database(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Try to match identification results with species in our database
        Enhances results with database information if a match is found
        """
        # Get all species from database
        species_collection = self.db["species"]
        db_species = list(species_collection.find({}))
        
        # Check if any database species names match our prediction
        predicted_name = results["species"].lower()
        
        # Try to find matches in scientific names or common names
        matches = []
        for species in db_species:
            scientific_name = species.get("scientific_name", "").lower()
            common_names = [name.lower() for name in species.get("common_names", [])]
            
            # Check for exact matches first
            if predicted_name == scientific_name or predicted_name in common_names:
                matches.append((species, 1.0))  # Perfect match score
            else:
                # Check for partial matches
                if predicted_name in scientific_name:
                    matches.append((species, 0.8))  # High match score
                else:
                    # Check if any words in the predicted name match with words in the database names
                    pred_words = set(predicted_name.split())
                    sci_words = set(scientific_name.split())
                    common_words = set([word for name in common_names for word in name.split()])
                    
                    # Calculate word overlap
                    sci_overlap = len(pred_words.intersection(sci_words)) / max(len(pred_words), len(sci_words)) if sci_words else 0
                    common_overlap = len(pred_words.intersection(common_words)) / max(len(pred_words), len(common_words)) if common_words else 0
                    
                    # Use the better match score
                    match_score = max(sci_overlap, common_overlap)
                    if match_score > 0.3:  # Threshold for considering it a match
                        matches.append((species, match_score))
        
        # Sort matches by score
        matches.sort(key=lambda x: x[1], reverse=True)
        
        # If we have matches, enhance the results with database information
        if matches:
            best_match, score = matches[0]
            
            # Only use the match if the score is good enough
            if score >= 0.5:
                results["species"] = best_match.get("scientific_name")
                results["common_names"] = best_match.get("common_names", [])
                results["type"] = best_match.get("type", results["type"])
                results["match_confidence"] = score
                results["database_match"] = True
                
                # Add information about the other potential matches
                results["alternative_matches"] = [
                    {
                        "species": match[0].get("scientific_name"),
                        "common_names": match[0].get("common_names", []),
                        "match_confidence": match[1]
                    }
                    for match in matches[1:3]  # Include top 2 alternative matches
                ]
        else:
            results["database_match"] = False
        
        return results