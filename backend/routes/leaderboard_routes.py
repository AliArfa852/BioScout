from flask import request, jsonify
from datetime import datetime, timedelta
from bson.objectid import ObjectId

def register_routes(bp, db):
    """Register leaderboard and rewards related routes"""
    
    @bp.route('/', methods=['GET'])
    def get_leaderboard():
        """Get the community contribution leaderboard"""
        try:
            # Get time period filter from query params (default: all-time)
            time_period = request.args.get('period', 'all-time')
            
            # Set date filter based on time period
            date_filter = None
            if time_period == 'weekly':
                date_filter = datetime.now() - timedelta(days=7)
            elif time_period == 'monthly':
                date_filter = datetime.now() - timedelta(days=30)
            elif time_period == 'yearly':
                date_filter = datetime.now() - timedelta(days=365)
            
            # Get limit from query (default: 10)
            try:
                limit = int(request.args.get('limit', 10))
                if limit < 1:
                    limit = 10
                elif limit > 100:
                    limit = 100
            except ValueError:
                limit = 10
            
            # Create pipeline for aggregation
            pipeline = []
            
            # Match stage for date filtering
            if date_filter:
                pipeline.append({
                    "$match": {
                        "created_at": {"$gte": date_filter}
                    }
                })
            
            # Group by user_id and count observations
            pipeline.append({
                "$group": {
                    "_id": "$user_id",
                    "observations_count": {"$sum": 1},
                    "verified_count": {
                        "$sum": {"$cond": [{"$eq": ["$verified", True]}, 1, 0]}
                    },
                    "points": {"$sum": "$points_awarded"},
                    "species": {"$addToSet": "$species_name"},
                    "latest_observation": {"$max": "$created_at"}
                }
            })
            
            # Add fields for additional stats
            pipeline.append({
                "$addFields": {
                    "unique_species_count": {"$size": "$species"}
                }
            })
            
            # Sort by points (descending)
            pipeline.append({
                "$sort": {"points": -1}
            })
            
            # Limit results
            pipeline.append({
                "$limit": limit
            })
            
            # Execute aggregation
            observations_collection = db['observations']
            leaderboard_data = list(observations_collection.aggregate(pipeline))
            
            # Get user details for each leaderboard entry
            users_collection = db['users']
            
            # Enrich leaderboard with user details
            for entry in leaderboard_data:
                user_id = entry['_id']
                user = users_collection.find_one({"_id": user_id})
                
                if user:
                    entry['username'] = user.get('username', 'Unknown User')
                    entry['profile_picture'] = user.get('profile_picture')
                else:
                    entry['username'] = 'Unknown User'
                    entry['profile_picture'] = None
                
                # Remove the species list (too large) and just keep count
                entry.pop('species', None)
            
            return jsonify({
                "time_period": time_period,
                "leaderboard": leaderboard_data
            }), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/user-stats/<user_id>', methods=['GET'])
    def get_user_stats(user_id):
        """Get detailed contribution statistics for a user"""
        try:
            # Get collections
            observations_collection = db['observations']
            users_collection = db['users']
            
            # Get user details
            user = users_collection.find_one({"_id": user_id})
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Get observation stats for user
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": None,
                    "total_observations": {"$sum": 1},
                    "verified_observations": {"$sum": {"$cond": [{"$eq": ["$verified", True]}, 1, 0]}},
                    "total_points": {"$sum": "$points_awarded"},
                    "unique_species": {"$addToSet": "$species_name"},
                    "first_observation": {"$min": "$created_at"},
                    "latest_observation": {"$max": "$created_at"}
                }}
            ]
            
            stats_result = list(observations_collection.aggregate(pipeline))
            
            if not stats_result:
                # No observations yet
                stats = {
                    "total_observations": 0,
                    "verified_observations": 0,
                    "total_points": 0,
                    "unique_species_count": 0,
                    "first_observation": None,
                    "latest_observation": None
                }
            else:
                stats = stats_result[0]
                stats["unique_species_count"] = len(stats.pop("unique_species", []))
                stats.pop("_id", None)
            
            # Get type distribution
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": "$type",
                    "count": {"$sum": 1}
                }}
            ]
            
            type_distribution = list(observations_collection.aggregate(pipeline))
            type_distribution = {item["_id"]: item["count"] for item in type_distribution}
            
            # Calculate ranking - overall
            pipeline = [
                {"$group": {
                    "_id": "$user_id",
                    "points": {"$sum": "$points_awarded"}
                }},
                {"$sort": {"points": -1}}
            ]
            
            ranking_result = list(observations_collection.aggregate(pipeline))
            overall_rank = None
            
            for i, entry in enumerate(ranking_result):
                if entry["_id"] == user_id:
                    overall_rank = i + 1
                    break
            
            # Calculate ranking - this week
            weekly_filter = datetime.now() - timedelta(days=7)
            pipeline = [
                {"$match": {"created_at": {"$gte": weekly_filter}}},
                {"$group": {
                    "_id": "$user_id",
                    "points": {"$sum": "$points_awarded"}
                }},
                {"$sort": {"points": -1}}
            ]
            
            ranking_result = list(observations_collection.aggregate(pipeline))
            weekly_rank = None
            
            for i, entry in enumerate(ranking_result):
                if entry["_id"] == user_id:
                    weekly_rank = i + 1
                    break
            
            # Get reward tier based on points
            reward_tier = calculate_reward_tier(stats.get("total_points", 0))
            
            # Assemble result
            result = {
                "user_id": user_id,
                "username": user.get("username", "Unknown"),
                "current_points": stats.get("total_points", 0),
                "statistics": stats,
                "type_distribution": type_distribution,
                "ranking": {
                    "overall": overall_rank,
                    "weekly": weekly_rank
                },
                "rewards": {
                    "tier": reward_tier["tier"],
                    "name": reward_tier["name"],
                    "description": reward_tier["description"],
                    "eco_impact": reward_tier["eco_impact"],
                    "next_tier_points": reward_tier["next_tier_points"]
                }
            }
            
            return jsonify(result), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/rewards', methods=['GET'])
    def get_reward_tiers():
        """Get all eco-friendly reward tiers"""
        try:
            # Get all reward tiers
            reward_tiers = [
                {
                    "tier": 1,
                    "name": "Seedling",
                    "points_required": 0,
                    "description": "Beginning your biodiversity journey. You're helping build our database!",
                    "eco_impact": "Digital certificate of participation in urban biodiversity mapping",
                    "digital_badge": "seedling_badge.svg"
                },
                {
                    "tier": 2,
                    "name": "Sapling",
                    "points_required": 100,
                    "description": "You're regularly contributing valuable data to our community.",
                    "eco_impact": "One tree planted on your behalf in Islamabad green areas",
                    "digital_badge": "sapling_badge.svg"
                },
                {
                    "tier": 3,
                    "name": "Ranger",
                    "points_required": 500,
                    "description": "Your significant contributions are making a real difference!",
                    "eco_impact": "Participation in community conservation event + tree planting",
                    "digital_badge": "ranger_badge.svg"
                },
                {
                    "tier": 4,
                    "name": "Guardian",
                    "points_required": 1000,
                    "description": "You're a dedicated protector of Islamabad's biodiversity.",
                    "eco_impact": "Guided tour of Islamabad's nature reserves + conservation kit",
                    "digital_badge": "guardian_badge.svg"
                },
                {
                    "tier": 5,
                    "name": "Steward",
                    "points_required": 2500,
                    "description": "Your expertise and dedication inspire our community.",
                    "eco_impact": "Named contributor on biodiversity report + 5 trees planted",
                    "digital_badge": "steward_badge.svg"
                },
                {
                    "tier": 6,
                    "name": "Sentinel",
                    "points_required": 5000,
                    "description": "A legendary contributor to Islamabad's ecological knowledge.",
                    "eco_impact": "Featured in conservation publication + habitat restoration project",
                    "digital_badge": "sentinel_badge.svg"
                }
            ]
            
            return jsonify(reward_tiers), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/achievements', methods=['GET'])
    def get_achievements():
        """Get all available achievements and user progress if authenticated"""
        try:
            # Get user ID from header
            user_id = request.headers.get('Authorization')
            
            # Define achievements
            achievements = [
                {
                    "id": "first_observation",
                    "name": "First Discovery",
                    "description": "Submit your first observation",
                    "points": 50,
                    "icon": "binoculars.svg"
                },
                {
                    "id": "verified_observation",
                    "name": "Verified Contributor",
                    "description": "Get your first observation verified",
                    "points": 100,
                    "icon": "check-badge.svg"
                },
                {
                    "id": "ten_observations",
                    "name": "Regular Explorer",
                    "description": "Submit at least 10 observations",
                    "points": 150,
                    "icon": "compass.svg"
                },
                {
                    "id": "five_species",
                    "name": "Diversity Spotter",
                    "description": "Observe 5 different species",
                    "points": 200,
                    "icon": "diversity.svg"
                },
                {
                    "id": "endangered_species",
                    "name": "Conservation Hero",
                    "description": "Spot an endangered species",
                    "points": 300,
                    "icon": "shield.svg"
                },
                {
                    "id": "all_types",
                    "name": "Naturalist",
                    "description": "Observe at least one plant, animal, and fungi",
                    "points": 250,
                    "icon": "earth.svg"
                },
                {
                    "id": "ten_verified",
                    "name": "Trusted Observer",
                    "description": "Get 10 observations verified",
                    "points": 350,
                    "icon": "star.svg"
                },
                {
                    "id": "seasonal_observer",
                    "name": "Seasonal Tracker",
                    "description": "Make observations in all four seasons",
                    "points": 400,
                    "icon": "calendar.svg"
                }
            ]
            
            # If user is authenticated, add completion status to achievements
            if user_id:
                observations_collection = db['observations']
                
                # Get all user observations
                user_observations = list(observations_collection.find({"user_id": user_id}))
                
                # Check achievement completion
                for achievement in achievements:
                    # Set default to incomplete
                    achievement["completed"] = False
                    
                    if achievement["id"] == "first_observation":
                        # Has at least one observation
                        achievement["completed"] = len(user_observations) > 0
                        
                    elif achievement["id"] == "verified_observation":
                        # Has at least one verified observation
                        achievement["completed"] = any(obs.get("verified", False) for obs in user_observations)
                        
                    elif achievement["id"] == "ten_observations":
                        # Has at least 10 observations
                        achievement["completed"] = len(user_observations) >= 10
                        
                    elif achievement["id"] == "five_species":
                        # Has observed at least 5 different species
                        unique_species = set(obs.get("species_name") for obs in user_observations if obs.get("species_name"))
                        achievement["completed"] = len(unique_species) >= 5
                        
                    elif achievement["id"] == "endangered_species":
                        # Check if user observed any endangered species
                        # This requires checking species status in species collection
                        species_collection = db['species']
                        endangered_species = [s["scientific_name"] for s in species_collection.find({"conservation_status": "endangered"})]
                        observed_species = [obs.get("species_name") for obs in user_observations if obs.get("species_name")]
                        achievement["completed"] = any(species in endangered_species for species in observed_species)
                        
                    elif achievement["id"] == "all_types":
                        # Has observed at least one plant, animal, and fungi
                        observed_types = set(obs.get("type") for obs in user_observations if obs.get("type"))
                        required_types = {"plant", "animal", "fungi"}
                        achievement["completed"] = required_types.issubset(observed_types)
                        
                    elif achievement["id"] == "ten_verified":
                        # Has at least 10 verified observations
                        verified_count = sum(1 for obs in user_observations if obs.get("verified", False))
                        achievement["completed"] = verified_count >= 10
                        
                    elif achievement["id"] == "seasonal_observer":
                        # Has observations in all seasons
                        # Define seasons based on months
                        winter = {12, 1, 2}
                        spring = {3, 4, 5}
                        summer = {6, 7, 8}
                        autumn = {9, 10, 11}
                        
                        # Get months of observations
                        months = set()
                        for obs in user_observations:
                            created_at = obs.get("created_at")
                            if created_at:
                                months.add(created_at.month)
                        
                        # Check if at least one month from each season
                        has_winter = any(month in winter for month in months)
                        has_spring = any(month in spring for month in months)
                        has_summer = any(month in summer for month in months)
                        has_autumn = any(month in autumn for month in months)
                        
                        achievement["completed"] = has_winter and has_spring and has_summer and has_autumn
            
            return jsonify(achievements), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

def calculate_reward_tier(points):
    """Calculate the reward tier based on points"""
    
    # Define reward tiers
    tiers = [
        {
            "tier": 1,
            "name": "Seedling",
            "points_required": 0,
            "description": "Beginning your biodiversity journey. You're helping build our database!",
            "eco_impact": "Digital certificate of participation in urban biodiversity mapping",
            "next_tier_points": 100
        },
        {
            "tier": 2,
            "name": "Sapling",
            "points_required": 100,
            "description": "You're regularly contributing valuable data to our community.",
            "eco_impact": "One tree planted on your behalf in Islamabad green areas",
            "next_tier_points": 500
        },
        {
            "tier": 3,
            "name": "Ranger",
            "points_required": 500,
            "description": "Your significant contributions are making a real difference!",
            "eco_impact": "Participation in community conservation event + tree planting",
            "next_tier_points": 1000
        },
        {
            "tier": 4,
            "name": "Guardian",
            "points_required": 1000,
            "description": "You're a dedicated protector of Islamabad's biodiversity.",
            "eco_impact": "Guided tour of Islamabad's nature reserves + conservation kit",
            "next_tier_points": 2500
        },
        {
            "tier": 5,
            "name": "Steward",
            "points_required": 2500,
            "description": "Your expertise and dedication inspire our community.",
            "eco_impact": "Named contributor on biodiversity report + 5 trees planted",
            "next_tier_points": 5000
        },
        {
            "tier": 6,
            "name": "Sentinel",
            "points_required": 5000,
            "description": "A legendary contributor to Islamabad's ecological knowledge.",
            "eco_impact": "Featured in conservation publication + habitat restoration project",
            "next_tier_points": None
        }
    ]
    
    # Find the highest tier that the points qualify for
    user_tier = tiers[0]
    for tier in reversed(tiers):
        if points >= tier["points_required"]:
            user_tier = tier
            break
    
    return user_tier