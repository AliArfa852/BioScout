from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from backend.db import init_db, get_db
from backend.routes import register_routes

app = Flask(__name__,
            static_folder='client/dist',
            static_url_path='/')

# Configure CORS
CORS(app)

# Initialize database
db = init_db()

# Register all routes
register_routes(app, db)

# Serve the React application
@app.route('/')
def serve():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_proxy(path):
    # Check if the path exists in the static folder
    static_path = os.path.join(app.static_folder, path)
    if os.path.isfile(static_path):
        return app.send_static_file(path)
    else:
        # If file doesn't exist, return index.html for client-side routing
        return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 3000)), debug=True)