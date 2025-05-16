import csv
import os
import io
import datetime
from bson import ObjectId
from pymongo import MongoClient
from typing import List, Dict, Any, Optional, Union

class DataManager:
    """
    Manages the import/export of biodiversity observation data in CSV format
    and ensures the data is properly integrated with the RAG system.
    """
    
    def __init__(self, db):
        """Initialize with database connection"""
        self.db = db
        self.csv_fields = [
            "observation_id", "species_name", "common_name", "date_observed", 
            "location", "image_url", "notes", "observer"
        ]
        
        # Ensure uploads directory exists
        os.makedirs('data/csv_exports', exist_ok=True)
    
    def import_csv(self, file_path_or_buffer: Union[str, io.StringIO]) -> Dict[str, Any]:
        """
        Import observations from CSV file into the database.
        
        Args:
            file_path_or_buffer: Path to CSV file or file-like object
            
        Returns:
            Dict with statistics about the import operation
        """
        is_file_path = isinstance(file_path_or_buffer, str)
        
        try:
            if is_file_path:
                file = open(file_path_or_buffer, 'r', encoding='utf-8')
            else:
                file = file_path_or_buffer
                
            reader = csv.DictReader(file)
            
            # Check if the CSV has the required fields
            if not all(field in reader.fieldnames for field in self.csv_fields):
                missing = [f for f in self.csv_fields if f not in reader.fieldnames]
                return {
                    "success": False,
                    "message": f"CSV is missing required fields: {', '.join(missing)}"
                }
            
            # Import statistics
            stats = {
                "total": 0,
                "inserted": 0,
                "updated": 0,
                "errors": 0
            }
            
            # Process each row
            for row in reader:
                stats["total"] += 1
                
                try:
                    # Parse date
                    try:
                        date_observed = datetime.datetime.strptime(
                            row["date_observed"], "%m/%d/%Y"
                        )
                    except ValueError:
                        # Try alternative format
                        date_observed = datetime.datetime.strptime(
                            row["date_observed"], "%Y-%m-%d"
                        )
                    
                    # Prepare observation document
                    observation = {
                        "observation_id": row["observation_id"],
                        "species_name": row["species_name"],
                        "common_names": [name.strip() for name in row["common_name"].split(',')] if row["common_name"] else [],
                        "date_observed": date_observed,
                        "location": row["location"],
                        "image_url": row["image_url"],
                        "notes": row["notes"],
                        "observer": row["observer"],
                        "imported_at": datetime.datetime.now(),
                        "type": self._infer_species_type(row["species_name"], row["common_name"]),
                        "verified": True  # Assume imported data is verified
                    }
                    
                    # Check if this observation already exists
                    existing = self.db.observations.find_one({"observation_id": row["observation_id"]})
                    
                    if existing:
                        # Update existing record
                        self.db.observations.update_one(
                            {"observation_id": row["observation_id"]},
                            {"$set": observation}
                        )
                        stats["updated"] += 1
                    else:
                        # Insert new record
                        self.db.observations.insert_one(observation)
                        stats["inserted"] += 1
                    
                    # Ensure species exists in the species collection
                    self._ensure_species_exists(
                        row["species_name"], 
                        row["common_name"],
                        row["image_url"]
                    )
                    
                except Exception as e:
                    stats["errors"] += 1
                    print(f"Error importing row {row.get('observation_id', 'unknown')}: {str(e)}")
            
            # After import, update the RAG knowledge base
            self._update_rag_knowledge_base()
            
            return {
                "success": True,
                "stats": stats,
                "message": f"Imported {stats['inserted']} new and updated {stats['updated']} existing observations."
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Import failed: {str(e)}"
            }
        finally:
            if is_file_path and 'file' in locals():
                file.close()
    
    def export_csv(self, query: Dict = None, file_path: Optional[str] = None) -> Union[str, io.StringIO]:
        """
        Export observations from database to CSV format.
        
        Args:
            query: MongoDB query to filter observations
            file_path: Optional path to save the CSV file
            
        Returns:
            File path if file_path is provided, else StringIO object with CSV data
        """
        try:
            # Default query if none provided
            if query is None:
                query = {}
                
            # Get observations
            observations = list(self.db.observations.find(query).sort("date_observed", -1))
            
            # Create CSV data
            output = io.StringIO() if file_path is None else open(file_path, 'w', newline='', encoding='utf-8')
            
            writer = csv.DictWriter(output, fieldnames=self.csv_fields)
            writer.writeheader()
            
            for obs in observations:
                # Format common names as comma-separated string
                common_names_str = ", ".join(obs.get("common_names", []))
                
                # Format date
                date_str = obs.get("date_observed").strftime("%m/%d/%Y") if obs.get("date_observed") else ""
                
                writer.writerow({
                    "observation_id": obs.get("observation_id", ""),
                    "species_name": obs.get("species_name", ""),
                    "common_name": common_names_str,
                    "date_observed": date_str,
                    "location": obs.get("location", ""),
                    "image_url": obs.get("image_url", ""),
                    "notes": obs.get("notes", ""),
                    "observer": obs.get("observer", "")
                })
            
            if file_path is None:
                # Return StringIO object with the CSV data
                output.seek(0)
                return output
            else:
                # Close the file and return the path
                output.close()
                return file_path
                
        except Exception as e:
            print(f"Export failed: {str(e)}")
            raise
    
    def generate_observation_id(self) -> str:
        """Generate a new sequential observation ID in the format OBS####"""
        # Find the highest existing observation ID
        highest = self.db.observations.find_one(
            {"observation_id": {"$regex": "^OBS\\d+$"}},
            sort=[("observation_id", -1)]
        )
        
        if highest and "observation_id" in highest:
            # Extract the number from the ID and increment
            current_num = int(highest["observation_id"][3:])
            new_num = current_num + 1
        else:
            # Start with 1 if no existing IDs
            new_num = 1
            
        # Format as OBS#### with leading zeros
        return f"OBS{new_num:04d}"
    
    def _infer_species_type(self, species_name: str, common_name: str) -> str:
        """
        Infer the type of species based on its name.
        Types: plant, animal, fungi, other
        
        This is a simple heuristic and could be improved with a more comprehensive approach.
        """
        # Combine names for better matching
        full_text = (species_name + " " + common_name).lower()
        
        # Birds
        bird_indicators = ["eagle", "kingfisher", "pigeon", "francolin", "hornbill", "owl", "sparrow", "bird"]
        if any(bird in full_text for bird in bird_indicators):
            return "animal"
            
        # Mammals
        mammal_indicators = ["leopard", "jackal", "pangolin", "monkey", "bat", "fox", "mongoose"]
        if any(mammal in full_text for mammal in mammal_indicators):
            return "animal"
            
        # Reptiles
        reptile_indicators = ["snake", "lizard", "turtle", "gecko", "monitor", "agama"]
        if any(reptile in full_text for reptile in reptile_indicators):
            return "animal"
            
        # Plants
        plant_indicators = ["tree", "flower", "plant", "grass", "shrub", "fern", "bush", "vine"]
        if any(plant in full_text for plant in plant_indicators):
            return "plant"
            
        # Fungi
        fungi_indicators = ["mushroom", "fungi", "fungus", "toadstool", "bracket"]
        if any(fungi in full_text for fungi in fungi_indicators):
            return "fungi"
            
        # Default to other if no match
        return "other"
    
    def _ensure_species_exists(self, scientific_name: str, common_name: str, image_url: str) -> None:
        """
        Ensure the species exists in the species collection.
        If not, create a basic entry that can be enriched later.
        """
        # Check if species already exists
        existing = self.db.species.find_one({"scientific_name": scientific_name})
        
        if not existing:
            # Prepare common names as a list
            common_names = [name.strip() for name in common_name.split(',')] if common_name else []
            
            # Infer species type
            species_type = self._infer_species_type(scientific_name, common_name)
            
            # Create new species document
            species_doc = {
                "scientific_name": scientific_name,
                "common_names": common_names,
                "type": species_type,
                "description": f"Species observed in Islamabad region.",
                "habitat": "Islamabad region",
                "imageUrls": [image_url] if image_url else [],
                "isEndemic": False,  # Default value, can be updated later
                "seasonalPresence": ["Spring", "Summer", "Autumn", "Winter"],  # Default to all seasons
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now()
            }
            
            # Insert the new species
            self.db.species.insert_one(species_doc)
    
    def _update_rag_knowledge_base(self) -> None:
        """
        Update the RAG knowledge base with the imported observation data.
        This creates or updates documents in the rag_documents collection.
        """
        # Get all observations
        observations = list(self.db.observations.find())
        
        # Get all species
        species = list(self.db.species.find())
        species_dict = {s["scientific_name"]: s for s in species}
        
        # For each observation, create or update a RAG document
        for obs in observations:
            species_info = species_dict.get(obs.get("species_name"), {})
            
            # Create content for the RAG document
            content = f"""
            Species: {obs.get('species_name')}
            Common Name(s): {', '.join(obs.get('common_names', []))}
            
            Observation Details:
            Date: {obs.get('date_observed').strftime('%B %d, %Y') if obs.get('date_observed') else 'Unknown'}
            Location: {obs.get('location', 'Unknown')}
            Observer: {obs.get('observer', 'Unknown')}
            Notes: {obs.get('notes', 'No additional notes.')}
            
            Species Information:
            Type: {species_info.get('type', 'Unknown')}
            Habitat: {species_info.get('habitat', 'Islamabad region')}
            Endemic: {'Yes' if species_info.get('isEndemic', False) else 'No'}
            Seasonal Presence: {', '.join(species_info.get('seasonalPresence', []))}
            Description: {species_info.get('description', 'No detailed description available.')}
            """
            
            # Clean up the content
            content = "\n".join(line.strip() for line in content.split("\n"))
            
            # Create document metadata
            metadata = {
                "source": "observation_data",
                "observation_id": obs.get("observation_id"),
                "species_name": obs.get("species_name"),
                "date": obs.get("date_observed"),
                "location": obs.get("location"),
                "type": species_info.get("type", "unknown")
            }
            
            # Check if a document for this observation already exists
            existing = self.db.rag_documents.find_one({
                "source": "observation_data",
                "observation_id": obs.get("observation_id")
            })
            
            if existing:
                # Update existing document
                self.db.rag_documents.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "content": content,
                            "metadata": metadata,
                            "updated_at": datetime.datetime.now()
                        }
                    }
                )
            else:
                # Create new document
                self.db.rag_documents.insert_one({
                    "title": f"Observation: {obs.get('species_name')}",
                    "content": content,
                    "metadata": metadata,
                    "embedding": None,  # Will be computed by the RAG system
                    "created_at": datetime.datetime.now(),
                    "updated_at": datetime.datetime.now()
                })
                
        print(f"Updated RAG knowledge base with {len(observations)} observation documents.")