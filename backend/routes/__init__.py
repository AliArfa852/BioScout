from flask import Blueprint, jsonify
from backend.models.image_processor import ImageProcessor
from backend.models.rag_system import RAGSystem
from backend.models.data_manager import DataManager

# Initialize blueprint objects for different route categories
species_bp = Blueprint('species', __name__, url_prefix='/api/species')
observations_bp = Blueprint('observations', __name__, url_prefix='/api/observations')
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
rag_bp = Blueprint('rag', __name__, url_prefix='/api/rag')
identify_bp = Blueprint('identify', __name__, url_prefix='/api/identify')
data_bp = Blueprint('data', __name__, url_prefix='/api/data')
leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/api/leaderboard')

# Global objects to be initialized once at app startup
image_processor = None
rag_system = None
data_manager = None

def register_routes(app, db):
    """
    Register all routes with the Flask application
    Initialize global processor objects
    """
    global image_processor, rag_system, data_manager
    
    # Import routes
    from .species_routes import register_routes as register_species_routes
    from .observation_routes import register_routes as register_observation_routes
    from .auth_routes import register_routes as register_auth_routes
    from .rag_routes import register_routes as register_rag_routes
    from .identify_routes import register_routes as register_identify_routes
    from .data_routes import register_routes as register_data_routes
    from .leaderboard_routes import register_routes as register_leaderboard_routes
    
    # Initialize processors
    image_processor = ImageProcessor(db)
    rag_system = RAGSystem(db)
    data_manager = DataManager(db)
    
    # Register route blueprints with respective handlers
    register_species_routes(species_bp, db)
    register_observation_routes(observations_bp, db, image_processor)
    register_auth_routes(auth_bp, db)
    register_rag_routes(rag_bp, db, rag_system)
    register_identify_routes(identify_bp, db, image_processor)
    register_data_routes(data_bp, db)
    register_leaderboard_routes(leaderboard_bp, db)
    
    # Register blueprints with the app
    app.register_blueprint(species_bp)
    app.register_blueprint(observations_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(rag_bp)
    app.register_blueprint(identify_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(leaderboard_bp)
    
    # Initialize RAG with data from observations collection
    # This ensures the RAG system is trained on the latest data
    rag_system.update_rag_from_csv()
    
    # Register error handlers
    register_error_handlers(app)
    
    return app

def register_error_handlers(app):
    """Register error handlers with the Flask app"""
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
        
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request", "message": str(error)}), 400
        
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal server error", "message": str(error)}), 500