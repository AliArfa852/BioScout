from flask import request, jsonify
import bcrypt
import jwt
import os
import datetime
from bson.objectid import ObjectId

# JWT Secret key
JWT_SECRET = os.environ.get('JWT_SECRET', 'bioscout_secret_key')
# Token expiration time (in minutes)
TOKEN_EXPIRATION = 60 * 24  # 24 hours

def register_routes(bp, db):
    users_collection = db['users']
    
    @bp.route('/register', methods=['POST'])
    def register():
        """Register a new user"""
        try:
            # Get request data
            data = request.json
            
            # Validate request data
            if not data:
                return jsonify({"error": "No data provided"}), 400
                
            required_fields = ['username', 'email', 'password']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Check if username or email already exists
            existing_user = users_collection.find_one({
                "$or": [
                    {"username": data['username']},
                    {"email": data['email']}
                ]
            })
            
            if existing_user:
                if existing_user.get('username') == data['username']:
                    return jsonify({"error": "Username already exists"}), 400
                else:
                    return jsonify({"error": "Email already exists"}), 400
            
            # Hash password
            hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
            
            # Create user data
            user_data = {
                "username": data['username'],
                "email": data['email'],
                "password": hashed_password.decode('utf-8'),
                "role": "user",
                "points": 0,
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now(),
                "profile_picture": data.get('profile_picture', None)
            }
            
            # Insert user into database
            result = users_collection.insert_one(user_data)
            
            # Create token
            token = jwt.encode({
                'sub': str(result.inserted_id),
                'username': user_data['username'],
                'role': user_data['role'],
                'exp': datetime.datetime.now() + datetime.timedelta(minutes=TOKEN_EXPIRATION)
            }, JWT_SECRET, algorithm='HS256')
            
            # Return user data and token
            return jsonify({
                "message": "User registered successfully",
                "id": str(result.inserted_id),
                "username": user_data['username'],
                "email": user_data['email'],
                "role": user_data['role'],
                "points": user_data['points'],
                "token": token
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/login', methods=['POST'])
    def login():
        """Login a user"""
        try:
            # Get request data
            data = request.json
            
            # Validate request data
            if not data:
                return jsonify({"error": "No data provided"}), 400
                
            # Check if username/email and password are provided
            if 'username' not in data and 'email' not in data:
                return jsonify({"error": "Username or email is required"}), 400
                
            if 'password' not in data:
                return jsonify({"error": "Password is required"}), 400
            
            # Find user by username or email
            query = {}
            if 'username' in data:
                query['username'] = data['username']
            else:
                query['email'] = data['email']
                
            user = users_collection.find_one(query)
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Check password
            if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
                return jsonify({"error": "Invalid password"}), 401
            
            # Create token
            token = jwt.encode({
                'sub': str(user['_id']),
                'username': user['username'],
                'role': user['role'],
                'exp': datetime.datetime.now() + datetime.timedelta(minutes=TOKEN_EXPIRATION)
            }, JWT_SECRET, algorithm='HS256')
            
            # Return user data and token
            return jsonify({
                "message": "Login successful",
                "id": str(user['_id']),
                "username": user['username'],
                "email": user['email'],
                "role": user['role'],
                "points": user['points'],
                "token": token
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/profile', methods=['GET'])
    def get_profile():
        """Get user profile"""
        try:
            # Get user ID from token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"error": "Authorization header is required"}), 401
                
            token = auth_header.split(' ')[1]
            
            try:
                # Decode token
                payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                user_id = payload['sub']
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401
            
            # Find user by ID
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Return user data
            return jsonify({
                "id": str(user['_id']),
                "username": user['username'],
                "email": user['email'],
                "role": user['role'],
                "points": user['points'],
                "profile_picture": user.get('profile_picture'),
                "created_at": user['created_at']
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/profile', methods=['PUT'])
    def update_profile():
        """Update user profile"""
        try:
            # Get user ID from token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"error": "Authorization header is required"}), 401
                
            token = auth_header.split(' ')[1]
            
            try:
                # Decode token
                payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                user_id = payload['sub']
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401
            
            # Get request data
            data = request.json
            
            # Find user by ID
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Fields that can be updated
            allowed_fields = ['profile_picture']
            
            # Update user data
            updates = {}
            for field in allowed_fields:
                if field in data:
                    updates[field] = data[field]
            
            # Update password if provided
            if 'password' in data and data.get('current_password'):
                # Check current password
                if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user['password'].encode('utf-8')):
                    return jsonify({"error": "Current password is incorrect"}), 401
                
                # Hash new password
                hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
                updates['password'] = hashed_password.decode('utf-8')
            
            # Always update the 'updated_at' field
            updates['updated_at'] = datetime.datetime.now()
            
            # Update user in database
            if updates:
                users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": updates}
                )
            
            # Return success response
            return jsonify({
                "message": "Profile updated successfully"
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    @bp.route('/leaderboard', methods=['GET'])
    def get_leaderboard():
        """Get user leaderboard by points"""
        try:
            # Get leaderboard from database
            pipeline = [
                {
                    "$project": {
                        "_id": 1,
                        "username": 1,
                        "points": 1,
                        "profile_picture": 1
                    }
                },
                {
                    "$sort": {
                        "points": -1
                    }
                },
                {
                    "$limit": 10
                }
            ]
            
            leaderboard = list(users_collection.aggregate(pipeline))
            
            # Format leaderboard
            result = []
            for i, user in enumerate(leaderboard):
                result.append({
                    "rank": i + 1,
                    "id": str(user['_id']),
                    "username": user['username'],
                    "points": user['points'],
                    "profile_picture": user.get('profile_picture')
                })
            
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500