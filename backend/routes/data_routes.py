from flask import request, jsonify, send_file
import io
import csv
import os
from bson import json_util
import json
from datetime import datetime
from backend.models.data_manager import DataManager

def register_routes(bp, db):
    """Register data import/export related routes"""
    
    # Initialize the data manager
    data_manager = DataManager(db)
    
    @bp.route('/import-csv', methods=['POST'])
    def import_csv():
        """Import observations from CSV file"""
        try:
            if 'file' not in request.files:
                return jsonify({"success": False, "message": "No file provided"}), 400
                
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({"success": False, "message": "No file selected"}), 400
                
            if not file.filename.endswith('.csv'):
                return jsonify({"success": False, "message": "File must be a CSV"}), 400
            
            # Process the CSV file
            csv_file = io.StringIO(file.read().decode('utf-8'))
            result = data_manager.import_csv(csv_file)
            
            # Return the import result
            return jsonify(result), 200 if result.get("success", False) else 400
                
        except Exception as e:
            return jsonify({"success": False, "message": f"Import failed: {str(e)}"}), 500
    
    @bp.route('/export-csv', methods=['GET'])
    def export_csv():
        """Export observations to CSV format"""
        try:
            # Get query parameters
            species = request.args.get('species')
            location = request.args.get('location')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            observer = request.args.get('observer')
            
            # Build query
            query = {}
            
            if species:
                query["species_name"] = {"$regex": species, "$options": "i"}
                
            if location:
                query["location"] = {"$regex": location, "$options": "i"}
                
            if observer:
                query["observer"] = {"$regex": observer, "$options": "i"}
                
            if start_date or end_date:
                date_query = {}
                
                if start_date:
                    try:
                        start = datetime.strptime(start_date, "%Y-%m-%d")
                        date_query["$gte"] = start
                    except ValueError:
                        return jsonify({"success": False, "message": "Invalid start_date format. Use YYYY-MM-DD"}), 400
                        
                if end_date:
                    try:
                        end = datetime.strptime(end_date, "%Y-%m-%d")
                        date_query["$lte"] = end
                    except ValueError:
                        return jsonify({"success": False, "message": "Invalid end_date format. Use YYYY-MM-DD"}), 400
                        
                if date_query:
                    query["date_observed"] = date_query
            
            # Generate file name with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"observations_{timestamp}.csv"
            file_path = os.path.join("data/csv_exports", filename)
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # Export data to CSV
            data_manager.export_csv(query, file_path)
            
            # Send the file
            return send_file(
                file_path,
                mimetype='text/csv',
                as_attachment=True,
                download_name=filename
            )
                
        except Exception as e:
            return jsonify({"success": False, "message": f"Export failed: {str(e)}"}), 500
    
    @bp.route('/generate-id', methods=['GET'])
    def generate_id():
        """Generate a new observation ID"""
        try:
            observation_id = data_manager.generate_observation_id()
            return jsonify({"success": True, "observation_id": observation_id}), 200
                
        except Exception as e:
            return jsonify({"success": False, "message": f"ID generation failed: {str(e)}"}), 500
    
    @bp.route('/observation-stats', methods=['GET'])
    def observation_stats():
        """Get statistics about the observations"""
        try:
            stats = {
                "total_observations": db.observations.count_documents({}),
                "total_species": len(db.observations.distinct("species_name")),
                "locations": db.observations.distinct("location"),
                "observers": db.observations.distinct("observer"),
                "most_recent": None
            }
            
            # Get most recent observation
            most_recent = list(db.observations.find().sort("date_observed", -1).limit(1))
            if most_recent:
                most_recent = most_recent[0]
                stats["most_recent"] = {
                    "observation_id": most_recent.get("observation_id", ""),
                    "species_name": most_recent.get("species_name", ""),
                    "date_observed": most_recent.get("date_observed").strftime("%Y-%m-%d") if most_recent.get("date_observed") else "",
                    "location": most_recent.get("location", ""),
                    "observer": most_recent.get("observer", "")
                }
            
            # Get type distribution
            type_pipeline = [
                {"$group": {"_id": "$type", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            type_dist = list(db.observations.aggregate(type_pipeline))
            stats["type_distribution"] = {item["_id"]: item["count"] for item in type_dist}
            
            # Get locations distribution
            location_pipeline = [
                {"$group": {"_id": "$location", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            location_dist = list(db.observations.aggregate(location_pipeline))
            stats["top_locations"] = {item["_id"]: item["count"] for item in location_dist}
            
            # Convert ObjectId to string for JSON serialization
            stats_json = json.loads(json_util.dumps(stats))
            
            return jsonify({"success": True, "stats": stats_json}), 200
                
        except Exception as e:
            return jsonify({"success": False, "message": f"Stats calculation failed: {str(e)}"}), 500