from flask import request, jsonify
from backend.models.observation import Observation
from bson.objectid import ObjectId
from datetime import datetime
import os
import json

def register_routes(bp, db, image_processor):
    observations_collection = db['observations']
    
    @bp.route('/', methods=['GET'])
    def get_all_observations():
        """Get all observations, with optional filtering"""
        try:
            # Get query parameters
            user_id = request.args.get('user_id')
            species_type = request.args.get('type')
            species_name = request.args.get('species_name')
            verified = request.args.get('verified')
            
            # Build query
            query = {}
            
            if user_id:
                query['user_id'] = user_id
                
            if species_type:
                query['type'] = species_type
                
            if species_name:
                query['species_name'] = {'$regex': species_name, '$options': 'i'}  # Case-insensitive search
                
            if verified is not None:
                query['verified'] = verified.lower() == 'true'
            
            # Get observations from database
            observations_data = list(observations_collection.find(query).sort('created_at', -1))
            
            # Convert MongoDB documents to Python dictionaries
            observations_list = []
            for obs in observations_data:
                # Convert ObjectId to string
                obs_dict = {
                    'id': str(obs['_id']),
                    'user_id': obs.get('user_id'),
                    'species_name': obs.get('species_name'),
                    'common_names': obs.get('common_names', []),
                    'location': obs.get('location'),
                    'image_url': obs.get('image_url'),
                    'type': obs.get('type'),
                    'description': obs.get('description'),
                    'identification_confidence': obs.get('identification_confidence', 0.0),
                    'verified': obs.get('verified', False),
                    'points_awarded': obs.get('points_awarded', 0),
                    'created_at': obs.get('created_at'),
                }
                observations_list.append(obs_dict)
            
            return jsonify(observations_list), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/<observation_id>', methods=['GET'])
    def get_observation(observation_id):
        """Get a single observation by ID"""
        try:
            # Find observation in database
            observation_data = observations_collection.find_one({"_id": ObjectId(observation_id)})
            
            if not observation_data:
                return jsonify({"error": "Observation not found"}), 404
            
            # Convert MongoDB document to Python dictionary
            observation = {
                'id': str(observation_data['_id']),
                'user_id': observation_data.get('user_id'),
                'species_name': observation_data.get('species_name'),
                'common_names': observation_data.get('common_names', []),
                'location': observation_data.get('location'),
                'image_url': observation_data.get('image_url'),
                'type': observation_data.get('type'),
                'description': observation_data.get('description'),
                'identification_confidence': observation_data.get('identification_confidence', 0.0),
                'verified': observation_data.get('verified', False),
                'points_awarded': observation_data.get('points_awarded', 0),
                'created_at': observation_data.get('created_at'),
            }
            
            return jsonify(observation), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/', methods=['POST'])
    def create_observation():
        """Create a new observation"""
        try:
            # Check if request is multipart form data or JSON
            if request.content_type and 'multipart/form-data' in request.content_type:
                # Handle multipart form data (with image upload)
                # This is mostly handled by the identify_routes.py already
                # But we'll keep this here for reference or future use
                if 'image' not in request.files:
                    return jsonify({"error": "Image is required"}), 400
                    
                # Process the image and create observation
                # This is similar to the code in identify_routes.py
                # For now, we'll just return an error suggesting the other endpoint
                return jsonify({
                    "error": "For image uploads, use the /api/identify/upload endpoint instead"
                }), 400
            else:
                # Handle JSON data (without image)
                data = request.json
                
                # Check required fields
                required_fields = ['user_id', 'species_name', 'location']
                for field in required_fields:
                    if field not in data:
                        return jsonify({"error": f"Missing required field: {field}"}), 400
                
                # Extract location data
                location = data.get('location')
                if not isinstance(location, dict) or 'coordinates' not in location:
                    return jsonify({"error": "Invalid location format"}), 400
                
                # Create observation data
                observation_data = {
                    "user_id": data['user_id'],
                    "species_name": data['species_name'],
                    "common_names": data.get('common_names', []),
                    "location": {
                        "type": "Point",
                        "coordinates": location['coordinates']  # Should be [longitude, latitude]
                    },
                    "image_url": data.get('image_url', ''),
                    "type": data.get('type', 'other'),
                    "description": data.get('description', ''),
                    "identification_confidence": data.get('identification_confidence', 0.0),
                    "verified": data.get('verified', False),
                    "points_awarded": data.get('points_awarded', 0),
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                
                # Insert observation into database
                result = observations_collection.insert_one(observation_data)
                
                # Return success response
                return jsonify({
                    "message": "Observation created successfully",
                    "id": str(result.inserted_id)
                }), 201
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/<observation_id>', methods=['PUT'])
    def update_observation(observation_id):
        """Update an observation"""
        try:
            # Get request data
            data = request.json
            
            # Find observation in database
            observation_data = observations_collection.find_one({"_id": ObjectId(observation_id)})
            
            if not observation_data:
                return jsonify({"error": "Observation not found"}), 404
            
            # Check if user is authorized to update this observation
            user_id = request.headers.get('Authorization')
            if user_id != observation_data.get('user_id') and 'admin' not in user_id.lower():
                return jsonify({"error": "Unauthorized to update this observation"}), 403
            
            # Update observation data
            updates = {}
            
            # Fields that can be updated
            allowed_fields = [
                'species_name', 'common_names', 'type', 'description', 
                'verified', 'identification_confidence'
            ]
            
            for field in allowed_fields:
                if field in data:
                    updates[field] = data[field]
            
            # Always update the 'updated_at' field
            updates['updated_at'] = datetime.now()
            
            # Update observation in database
            observations_collection.update_one(
                {"_id": ObjectId(observation_id)},
                {"$set": updates}
            )
            
            # Return success response
            return jsonify({
                "message": "Observation updated successfully",
                "id": observation_id
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/verify/<observation_id>', methods=['PUT'])
    def verify_observation(observation_id):
        """Verify an observation (admin only)"""
        try:
            # Check if user is admin
            user_id = request.headers.get('Authorization')
            if not user_id or 'admin' not in user_id.lower():
                return jsonify({"error": "Unauthorized - Admin access required"}), 403
            
            # Find observation in database
            observation_data = observations_collection.find_one({"_id": ObjectId(observation_id)})
            
            if not observation_data:
                return jsonify({"error": "Observation not found"}), 404
            
            # Get verification status from request
            data = request.json
            verified = data.get('verified', True)
            
            # Award bonus points if being verified for the first time
            points_awarded = observation_data.get('points_awarded', 0)
            if verified and not observation_data.get('verified', False):
                # Add 10 bonus points for verification
                points_awarded += 10
            
            # Update observation in database
            observations_collection.update_one(
                {"_id": ObjectId(observation_id)},
                {
                    "$set": {
                        "verified": verified,
                        "points_awarded": points_awarded,
                        "updated_at": datetime.now()
                    }
                }
            )
            
            # Return success response
            return jsonify({
                "message": "Observation verification updated",
                "id": observation_id,
                "verified": verified,
                "points_awarded": points_awarded
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/stats', methods=['GET'])
    def get_observation_stats():
        """Get statistics about observations"""
        try:
            # Get statistics from database
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total": {"$sum": 1},
                        "verified": {"$sum": {"$cond": ["$verified", 1, 0]}},
                        "plants": {"$sum": {"$cond": [{"$eq": ["$type", "plant"]}, 1, 0]}},
                        "animals": {"$sum": {"$cond": [{"$eq": ["$type", "animal"]}, 1, 0]}},
                        "fungi": {"$sum": {"$cond": [{"$eq": ["$type", "fungi"]}, 1, 0]}},
                        "other": {"$sum": {"$cond": [{"$eq": ["$type", "other"]}, 1, 0]}}
                    }
                }
            ]
            
            stats_result = list(observations_collection.aggregate(pipeline))
            
            # Extract statistics
            stats = stats_result[0] if stats_result else {
                "total": 0,
                "verified": 0,
                "plants": 0,
                "animals": 0,
                "fungi": 0,
                "other": 0
            }
            
            # Remove MongoDB ID
            if '_id' in stats:
                del stats['_id']
            
            # Get recent observations
            recent_observations = list(
                observations_collection.find().sort('created_at', -1).limit(5)
            )
            
            # Format recent observations
            recent = []
            for obs in recent_observations:
                recent.append({
                    "id": str(obs['_id']),
                    "species_name": obs.get('species_name'),
                    "type": obs.get('type', 'other'),
                    "created_at": obs.get('created_at'),
                    "verified": obs.get('verified', False)
                })
            
            # Add recent observations to stats
            stats['recent'] = recent
            
            return jsonify(stats), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500