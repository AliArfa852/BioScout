"""
Leaderboard Routes Module

This module contains routes for the community contribution leaderboard
and eco-friendly rewards system.
"""
from flask import Blueprint, jsonify, request
from bson.objectid import ObjectId
import datetime

def register_routes(bp, db):
    """Register leaderboard routes with blueprint"""
    
    @bp.route('/', methods=['GET'])
    def get_leaderboard():
        """Get the community contribution leaderboard"""
        try:
            timeframe = request.args.get('timeframe', 'all')
            category = request.args.get('category', 'all')
            limit = int(request.args.get('limit', 10))
            
            # Base aggregation pipeline
            pipeline = [
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }},
                {"$unwind": "$user"},
                {"$project": {
                    "observation_id": 1,
                    "date_observed": 1,
                    "points_awarded": 1,
                    "location_text": 1,
                    "verified": 1,
                    "username": "$user.username",
                    "profile_image_url": "$user.profile_image_url"
                }}
            ]
            
            # Apply timeframe filter
            now = datetime.datetime.now()
            if timeframe == 'week':
                week_ago = now - datetime.timedelta(days=7)
                pipeline.insert(0, {"$match": {"date_observed": {"$gte": week_ago}}})
            elif timeframe == 'month':
                month_ago = now - datetime.timedelta(days=30)
                pipeline.insert(0, {"$match": {"date_observed": {"$gte": month_ago}}})
            elif timeframe == 'year':
                year_ago = now - datetime.timedelta(days=365)
                pipeline.insert(0, {"$match": {"date_observed": {"$gte": year_ago}}})
                
            # Get species info for category filtering
            if category != 'all':
                pipeline.insert(0, {
                    "$lookup": {
                        "from": "species",
                        "localField": "species_id",
                        "foreignField": "_id",
                        "as": "species"
                    }
                })
                pipeline.insert(1, {"$unwind": "$species"})
                pipeline.insert(2, {"$match": {"species.type": category}})
            
            # Group by user and calculate total points and observations
            pipeline.extend([
                {"$group": {
                    "_id": "$username",
                    "profile_image_url": {"$first": "$profile_image_url"},
                    "total_points": {"$sum": "$points_awarded"},
                    "observation_count": {"$sum": 1},
                    "verified_count": {
                        "$sum": {"$cond": [{"$eq": ["$verified", True]}, 1, 0]}
                    },
                    "latest_observation": {"$max": "$date_observed"},
                    "observations": {
                        "$push": {
                            "observation_id": "$observation_id",
                            "date_observed": "$date_observed",
                            "points_awarded": "$points_awarded",
                            "location_text": "$location_text"
                        }
                    }
                }},
                {"$sort": {"total_points": -1}},
                {"$limit": limit},
                {"$project": {
                    "_id": 0,
                    "username": "$_id",
                    "profile_image_url": 1,
                    "total_points": 1,
                    "observation_count": 1,
                    "verified_count": 1,
                    "latest_observation": 1,
                    "recent_observations": {"$slice": ["$observations", 3]},
                    "eco_impact": {
                        "$multiply": [{"$divide": ["$total_points", 10]}, 0.5]
                    }
                }}
            ])
            
            leaderboard = list(db.observations.aggregate(pipeline))
            
            return jsonify({
                "status": "success",
                "timeframe": timeframe,
                "category": category,
                "leaderboard": leaderboard
            })
        
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Failed to retrieve leaderboard: {str(e)}"
            }), 500
    
    @bp.route('/eco-rewards', methods=['GET'])
    def get_eco_rewards():
        """Get the available eco-friendly rewards"""
        try:
            rewards = [
                {
                    "id": "tree-planting",
                    "name": "Tree Planting Initiative",
                    "description": "For every 500 points, BioScout plants a native tree in Islamabad's green spaces.",
                    "points_required": 500,
                    "impact": "One tree absorbs ~21kg of CO2 annually and provides habitat for local wildlife.",
                    "icon": "tree",
                    "category": "conservation"
                },
                {
                    "id": "clean-water",
                    "name": "Clean Water Project",
                    "description": "When you reach 1000 points, BioScout donates to local clean water initiatives.",
                    "points_required": 1000,
                    "impact": "Helps restore aquatic habitats and improves water quality in Rawal Lake.",
                    "icon": "droplet",
                    "category": "conservation"
                },
                {
                    "id": "solar-lamp",
                    "name": "Solar Study Lamp",
                    "description": "Earn 1500 points to receive a solar-powered study lamp, perfect for students.",
                    "points_required": 1500,
                    "impact": "Reduces carbon emissions while providing sustainable lighting for education.",
                    "icon": "sun",
                    "category": "product"
                },
                {
                    "id": "seed-kit",
                    "name": "Native Plant Seed Kit",
                    "description": "At 800 points, receive a seed kit containing native plant species to grow at home.",
                    "points_required": 800,
                    "impact": "Creates micro-habitats for pollinators and helps preserve local biodiversity.",
                    "icon": "seedling",
                    "category": "product"
                },
                {
                    "id": "reusable-bottle",
                    "name": "Eco-Friendly Water Bottle",
                    "description": "Earn 1200 points to receive a sustainable bamboo and stainless steel water bottle.",
                    "points_required": 1200,
                    "impact": "Reduces plastic waste by replacing approximately 167 single-use bottles annually.",
                    "icon": "bottle",
                    "category": "product"
                },
                {
                    "id": "wildlife-workshop",
                    "name": "Wildlife Photography Workshop",
                    "description": "Earn 2000 points to join a professional wildlife photography workshop in Margalla Hills.",
                    "points_required": 2000,
                    "impact": "Develops skills to document and raise awareness about local biodiversity.",
                    "icon": "camera",
                    "category": "experience"
                }
            ]
            
            # Filter by category if provided
            category = request.args.get('category')
            if category:
                rewards = [r for r in rewards if r['category'] == category]
                
            return jsonify({
                "status": "success",
                "rewards": rewards
            })
            
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Failed to retrieve eco rewards: {str(e)}"
            }), 500
    
    @bp.route('/user/<username>/eligibility', methods=['GET'])
    def get_user_reward_eligibility(username):
        """Get a user's eligibility for eco-friendly rewards"""
        try:
            # Get user info
            user = db.users.find_one({"username": username})
            if not user:
                return jsonify({
                    "status": "error",
                    "message": f"User {username} not found"
                }), 404
                
            # Get user's points
            user_points = user.get('points', 0)
            
            # Get eco rewards
            rewards = [
                {
                    "id": "tree-planting",
                    "name": "Tree Planting Initiative",
                    "points_required": 500,
                    "icon": "tree"
                },
                {
                    "id": "clean-water",
                    "name": "Clean Water Project",
                    "points_required": 1000,
                    "icon": "droplet"
                },
                {
                    "id": "solar-lamp",
                    "name": "Solar Study Lamp",
                    "points_required": 1500,
                    "icon": "sun"
                },
                {
                    "id": "seed-kit",
                    "name": "Native Plant Seed Kit",
                    "points_required": 800,
                    "icon": "seedling"
                },
                {
                    "id": "reusable-bottle",
                    "name": "Eco-Friendly Water Bottle",
                    "points_required": 1200,
                    "icon": "bottle"
                },
                {
                    "id": "wildlife-workshop",
                    "name": "Wildlife Photography Workshop",
                    "points_required": 2000,
                    "icon": "camera"
                }
            ]
            
            # Calculate eligibility and progress for each reward
            for reward in rewards:
                points_required = reward['points_required']
                reward['eligible'] = user_points >= points_required
                reward['progress'] = min(100, round((user_points / points_required) * 100))
            
            # Get user's claimed rewards (from user_badges collection)
            claimed_rewards = list(db.user_badges.find(
                {"user_id": user["_id"], "details.reward_id": {"$exists": True}},
                {"details.reward_id": 1}
            ))
            
            claimed_reward_ids = [r.get('details', {}).get('reward_id') for r in claimed_rewards]
            
            return jsonify({
                "status": "success",
                "username": username,
                "points": user_points,
                "rewards": rewards,
                "claimed_rewards": claimed_reward_ids,
                "eco_impact": {
                    "trees_planted": len([r for r in claimed_rewards if r.get('details', {}).get('reward_id') == "tree-planting"]),
                    "water_projects": len([r for r in claimed_rewards if r.get('details', {}).get('reward_id') == "clean-water"]),
                    "co2_reduced": round(user_points * 0.05, 2)  # Simplified calculation
                }
            })
            
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Failed to check reward eligibility: {str(e)}"
            }), 500
    
    @bp.route('/claim-reward', methods=['POST'])
    def claim_eco_reward():
        """Claim an eco-friendly reward"""
        try:
            data = request.json
            user_id = data.get('user_id')
            reward_id = data.get('reward_id')
            
            if not user_id or not reward_id:
                return jsonify({
                    "status": "error",
                    "message": "User ID and reward ID are required"
                }), 400
            
            # Check if this is a valid ObjectId
            try:
                user_id_obj = ObjectId(user_id)
            except:
                return jsonify({
                    "status": "error",
                    "message": "Invalid user ID format"
                }), 400
            
            # Get user
            user = db.users.find_one({"_id": user_id_obj})
            if not user:
                return jsonify({
                    "status": "error",
                    "message": "User not found"
                }), 404
            
            # Get reward details
            rewards = {
                "tree-planting": {"name": "Tree Planting Initiative", "points": 500},
                "clean-water": {"name": "Clean Water Project", "points": 1000},
                "solar-lamp": {"name": "Solar Study Lamp", "points": 1500},
                "seed-kit": {"name": "Native Plant Seed Kit", "points": 800},
                "reusable-bottle": {"name": "Eco-Friendly Water Bottle", "points": 1200},
                "wildlife-workshop": {"name": "Wildlife Photography Workshop", "points": 2000}
            }
            
            if reward_id not in rewards:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid reward ID: {reward_id}"
                }), 400
            
            reward = rewards[reward_id]
            
            # Check if user has enough points
            if user.get('points', 0) < reward['points']:
                return jsonify({
                    "status": "error",
                    "message": f"Not enough points to claim this reward. Need {reward['points']} points."
                }), 400
            
            # Check if user already claimed this reward
            existing_claim = db.user_badges.find_one({
                "user_id": user_id_obj,
                "details.reward_id": reward_id
            })
            
            if existing_claim:
                return jsonify({
                    "status": "error",
                    "message": f"You have already claimed this reward"
                }), 400
            
            # Create badge for the reward
            badge_id = db.badges.insert_one({
                "name": f"Eco-Reward: {reward['name']}",
                "description": f"Claimed the {reward['name']} eco-friendly reward",
                "icon": reward_id,
                "points": reward['points'],
                "requirements": {"points": reward['points']},
                "created_at": datetime.datetime.now()
            }).inserted_id
            
            # Record the claim
            db.user_badges.insert_one({
                "user_id": user_id_obj,
                "badge_id": badge_id,
                "awarded_at": datetime.datetime.now(),
                "details": {
                    "reward_id": reward_id,
                    "reward_name": reward['name'],
                    "points_used": reward['points']
                }
            })
            
            # Deduct points from user
            db.users.update_one(
                {"_id": user_id_obj},
                {"$inc": {"points": -reward['points']}}
            )
            
            # Log the claim in audit logs
            db.audit_logs.insert_one({
                "user_id": user_id_obj,
                "action": "claim_reward",
                "entity_type": "reward",
                "entity_id": badge_id,
                "details": {
                    "reward_id": reward_id,
                    "reward_name": reward['name'],
                    "points_used": reward['points']
                },
                "timestamp": datetime.datetime.now()
            })
            
            return jsonify({
                "status": "success",
                "message": f"Successfully claimed {reward['name']}",
                "reward": {
                    "id": reward_id,
                    "name": reward['name'],
                    "points_used": reward['points']
                },
                "user_points_remaining": user.get('points', 0) - reward['points']
            })
            
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Failed to claim reward: {str(e)}"
            }), 500
    
    @bp.route('/stats', methods=['GET'])
    def get_community_stats():
        """Get community contribution statistics"""
        try:
            # Get total observations
            total_observations = db.observations.count_documents({})
            
            # Get total users who have contributed
            contributors = db.observations.distinct('user_id')
            total_contributors = len(contributors)
            
            # Get total species recorded
            species_recorded = db.observations.distinct('species_id')
            total_species = len(species_recorded)
            
            # Calculate environmental impact
            # Simple estimates for demonstration
            trees_planted = db.user_badges.count_documents({"details.reward_id": "tree-planting"})
            water_projects = db.user_badges.count_documents({"details.reward_id": "clean-water"})
            
            # Calculate CO2 impact (simplified)
            # Assuming each tree absorbs ~21kg CO2 annually and we have additional offsets from other activities
            co2_reduced = trees_planted * 21 + (total_observations * 0.05)
            
            # Get observation distribution by species type
            pipeline = [
                {"$lookup": {
                    "from": "species",
                    "localField": "species_id",
                    "foreignField": "_id",
                    "as": "species"
                }},
                {"$unwind": "$species"},
                {"$group": {
                    "_id": "$species.type",
                    "count": {"$sum": 1}
                }},
                {"$project": {
                    "_id": 0,
                    "type": "$_id",
                    "count": 1
                }}
            ]
            
            type_distribution = list(db.observations.aggregate(pipeline))
            
            # Get monthly observation trends
            now = datetime.datetime.now()
            six_months_ago = now - datetime.timedelta(days=180)
            
            pipeline = [
                {"$match": {"date_observed": {"$gte": six_months_ago}}},
                {"$project": {
                    "year": {"$year": "$date_observed"},
                    "month": {"$month": "$date_observed"}
                }},
                {"$group": {
                    "_id": {"year": "$year", "month": "$month"},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id.year": 1, "_id.month": 1}},
                {"$project": {
                    "_id": 0,
                    "year": "$_id.year",
                    "month": "$_id.month",
                    "count": 1
                }}
            ]
            
            monthly_trends = list(db.observations.aggregate(pipeline))
            
            # Format monthly trend data
            formatted_trends = []
            for item in monthly_trends:
                month_name = datetime.datetime(item['year'], item['month'], 1).strftime('%b')
                formatted_trends.append({
                    "month": f"{month_name} {item['year']}",
                    "count": item['count']
                })
            
            return jsonify({
                "status": "success",
                "stats": {
                    "total_observations": total_observations,
                    "total_contributors": total_contributors,
                    "total_species": total_species,
                    "environmental_impact": {
                        "trees_planted": trees_planted,
                        "water_projects": water_projects,
                        "co2_reduced_kg": round(co2_reduced, 2)
                    },
                    "type_distribution": type_distribution,
                    "monthly_trends": formatted_trends
                }
            })
            
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Failed to retrieve community stats: {str(e)}"
            }), 500