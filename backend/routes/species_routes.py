from flask import request, jsonify
from backend.models.species import Species
from bson.objectid import ObjectId
from datetime import datetime

def register_routes(bp, db):
    species_collection = db['species']
    
    @bp.route('/', methods=['GET'])
    def get_all_species():
        """Get all species"""
        try:
            # Get species from database
            species_data = list(species_collection.find())
            
            # Convert MongoDB documents to Python objects
            species_list = [Species.from_dict(species).to_dict() for species in species_data]
            
            # Add ID to each species
            for i, species in enumerate(species_list):
                species['id'] = str(species_data[i].get('_id'))
            
            return jsonify(species_list), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/<species_id>', methods=['GET'])
    def get_species(species_id):
        """Get a single species by ID"""
        try:
            # Find species in database
            species_data = species_collection.find_one({"_id": ObjectId(species_id)})
            
            if not species_data:
                return jsonify({"error": "Species not found"}), 404
            
            # Convert MongoDB document to Python object
            species = Species.from_dict(species_data).to_dict()
            species['id'] = species_id
            
            return jsonify(species), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/', methods=['POST'])
    def create_species():
        """Create a new species"""
        try:
            # Get request data
            data = request.json
            
            # Ensure required fields are present
            required_fields = ['scientific_name', 'common_names', 'type', 'description', 'habitat']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Create a new Species object
            species = Species(
                scientific_name=data['scientific_name'],
                common_names=data['common_names'],
                type=data['type'],
                description=data['description'],
                habitat=data['habitat'],
                image_urls=data.get('image_urls', []),
                is_endemic=data.get('is_endemic', False),
                seasonal_presence=data.get('seasonal_presence', []),
                conservation_status=data.get('conservation_status'),
                dietary_habits=data.get('dietary_habits'),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # Save species to database
            insert_result = species_collection.insert_one(species.to_dict())
            
            # Return success response
            return jsonify({
                "message": "Species created successfully",
                "id": str(insert_result.inserted_id)
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/<species_id>', methods=['PUT'])
    def update_species(species_id):
        """Update a species"""
        try:
            # Get request data
            data = request.json
            
            # Find species in database
            species_data = species_collection.find_one({"_id": ObjectId(species_id)})
            
            if not species_data:
                return jsonify({"error": "Species not found"}), 404
            
            # Create updated species dictionary
            updated_species = {
                "scientific_name": data.get('scientific_name', species_data.get('scientific_name')),
                "common_names": data.get('common_names', species_data.get('common_names')),
                "type": data.get('type', species_data.get('type')),
                "description": data.get('description', species_data.get('description')),
                "habitat": data.get('habitat', species_data.get('habitat')),
                "image_urls": data.get('image_urls', species_data.get('image_urls')),
                "is_endemic": data.get('is_endemic', species_data.get('is_endemic')),
                "seasonal_presence": data.get('seasonal_presence', species_data.get('seasonal_presence')),
                "conservation_status": data.get('conservation_status', species_data.get('conservation_status')),
                "dietary_habits": data.get('dietary_habits', species_data.get('dietary_habits')),
                "created_at": species_data.get('created_at'),
                "updated_at": datetime.now()
            }
            
            # Update species in database
            species_collection.update_one(
                {"_id": ObjectId(species_id)},
                {"$set": updated_species}
            )
            
            # Return success response
            return jsonify({
                "message": "Species updated successfully",
                "id": species_id
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500