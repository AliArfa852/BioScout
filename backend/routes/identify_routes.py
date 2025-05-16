from flask import request, jsonify
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid

UPLOAD_FOLDER = 'data/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def register_routes(bp, db, image_processor):
    # Ensure upload directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    @bp.route('/', methods=['POST'])
    def identify_species():
        """
        Identify species from uploaded image
        Returns identification results without saving to database
        """
        try:
            # Check if image is provided
            if 'image' not in request.files:
                return jsonify({"error": "No image provided"}), 400
                
            file = request.files['image']
            
            # Check if filename is empty
            if file.filename == '':
                return jsonify({"error": "No image selected"}), 400
                
            # Check if file is allowed
            if not allowed_file(file.filename):
                return jsonify({"error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
            
            # Read file contents
            file_content = file.read()
            
            # Process image for identification
            identification_result = image_processor.identify_species(file_content)
            
            return jsonify(identification_result), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    @bp.route('/upload', methods=['POST'])
    def identify_and_save():
        """
        Identify species from uploaded image and save to database
        Returns identification results and observation ID
        """
        try:
            # Check if user ID is provided in headers or form data
            user_id = request.headers.get('Authorization') or request.form.get('user_id')
            if not user_id:
                return jsonify({"error": "User ID is required"}), 400
                
            # Check if image is provided
            if 'image' not in request.files:
                return jsonify({"error": "No image provided"}), 400
                
            file = request.files['image']
            
            # Check if filename is empty
            if file.filename == '':
                return jsonify({"error": "No image selected"}), 400
                
            # Check if file is allowed
            if not allowed_file(file.filename):
                return jsonify({"error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
            
            # Save file with secure filename
            filename = secure_filename(file.filename)
            # Add unique identifier to prevent filename collisions
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            
            # Read file content for processing
            file_content = file.read()
            
            # Save file to disk
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            # Process image for identification
            identification_result = image_processor.identify_species(file_content)
            
            # Extract species information from form data or use identification result
            species_name = request.form.get('species_name') or identification_result.get('species')
            common_names_str = request.form.get('common_names', '[]')
            
            # Parse common names (might be JSON string or comma-separated list)
            try:
                import json
                common_names = json.loads(common_names_str)
            except json.JSONDecodeError:
                # Fallback to comma-separated list
                common_names = [name.strip() for name in common_names_str.split(',') if name.strip()]
            
            # Get location data
            latitude = request.form.get('latitude')
            longitude = request.form.get('longitude')
            
            if not latitude or not longitude:
                return jsonify({"error": "Latitude and longitude are required"}), 400
                
            # Convert to float
            try:
                latitude = float(latitude)
                longitude = float(longitude)
            except ValueError:
                return jsonify({"error": "Invalid latitude or longitude format"}), 400
            
            # Get description
            description = request.form.get('description', '')
            
            # Prepare observation data
            observation_data = {
                "user_id": user_id,
                "species_name": species_name,
                "common_names": common_names,
                "location": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]  # GeoJSON format: [longitude, latitude]
                },
                "image_url": f"/uploads/{unique_filename}",  # Relative URL
                "type": identification_result.get('type', 'other'),
                "description": description,
                "identification_confidence": identification_result.get('confidence', 0.0),
                "verified": False,  # New observations start as unverified
                "points_awarded": _calculate_points(db, species_name),  # Calculate points for the observation
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Save observation to database
            observations_collection = db['observations']
            insert_result = observations_collection.insert_one(observation_data)
            
            # Add observation ID to result
            observation_data['id'] = str(insert_result.inserted_id)
            
            # Return observation data
            return jsonify({
                "message": "Observation saved successfully",
                "id": observation_data['id'],
                "identification": identification_result,
                "observation": observation_data
            }), 201
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
def _calculate_points(db, species_name):
    """Calculate points to award for an observation based on rarity"""
    try:
        # Check how many observations of this species exist in the database
        observations_collection = db['observations']
        existing_observations = observations_collection.count_documents({"species_name": species_name})
        
        # Award more points for first observations of a species
        if existing_observations == 0:
            return 50  # First observation of this species
        elif existing_observations < 5:
            return 20  # Rare species (less than 5 observations)
        elif existing_observations < 20:
            return 10  # Uncommon species (less than 20 observations)
        else:
            return 5   # Common species
            
    except Exception:
        # Default points if calculation fails
        return 5