from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from collections import Counter
import os
import uuid
import re
from utils import (load_observations, save_observation, load_knowledge_base,
                   query_similar_texts, generate_answer, save_uploaded_image, build_faiss_index)

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = "uploads"
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

observations = load_observations().to_dict(orient='records')
FAISS_INDEX, FAISS_CORPUS = build_faiss_index()

@app.route("/api/observations", methods=["GET"])
def get_observations():
    return jsonify(observations)


@app.route("/api/submit", methods=["POST"])
def submit_observation():
    try:
        # Parse data from multipart/form-data or JSON
        if request.content_type.startswith('multipart/form-data'):
            data = request.form.to_dict()
            image_file = request.files.get('image')
            image_url = ""
            if image_file:
                image_path = save_uploaded_image(image_file)
                image_url = f"/uploads/{os.path.basename(image_path)}"
            else:
                image_url = data.get("image_url", "")
        else:
            data = request.json or {}
            image_url = data.get("image_url", "")

        # Validate required fields
        required = ["species_name", "common_name", "date_observed", "location"]
        missing = [field for field in required if not data.get(field)]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        new_obs = {
            "observation_id": str(uuid.uuid4())[:8].upper(),
            "species_name": data.get("species_name", "").strip(),
            "common_name": data.get("common_name", "").strip(),
            "date_observed": data.get("date_observed", "").strip(),
            "location": data.get("location", "").strip(),
            "image_url": image_url,
            "notes": data.get("notes", "").strip(),
            "observer": data.get("observer", "Anonymous").strip() or "Anonymous"
        }

        observations.append(new_obs)
        save_observation(new_obs)

        # Update FAISS index with new data
        global FAISS_INDEX, FAISS_CORPUS
        FAISS_INDEX, FAISS_CORPUS = build_faiss_index()

        return jsonify({"message": "Observation submitted successfully!", "observation": new_obs}), 201

    except Exception as e:
        return jsonify({"error": f"Submission failed: {str(e)}"}), 500


@app.route("/api/ai-species-id", methods=["POST"])
def ai_species_id():
    # Placeholder for real AI model integration
    return jsonify({
        "suggestions": [
            {"species_name": "Aquila rapax", "common_name": "Tawny Eagle", "confidence": 0.92},
            {"species_name": "Buceros bicornis", "common_name": "Great Hornbill", "confidence": 0.87},
        ]
    })


@app.route("/uploads/<filename>")
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# @app.route("/api/qa", methods=["POST"])
# def qa():
#     user_question = request.json.get("question", "").strip()
#     if not user_question:
#         return jsonify({"error": "Empty question"}), 400

#     try:
#         # Normalize question text
#         query = user_question.lower()

#         # Retrieve top relevant snippets from RAG
#         retrieved_snippets = query_similar_texts(query, top_k=5)

#         # Fallback: If no snippets retrieved, try simple keyword search in knowledge base + observations
#         if not retrieved_snippets:
#             kb = load_knowledge_base()
#             obs_notes = [obs.get("notes", "") for obs in observations if obs.get("notes")]
#             all_texts = kb + obs_notes

#             keywords = re.findall(r"\w+", query)
#             retrieved_snippets = []
#             for text in all_texts:
#                 if any(kw in text.lower() for kw in keywords):
#                     retrieved_snippets.append(text)
#             retrieved_snippets = retrieved_snippets[:5]

#         # If still empty, respond politely
#         if not retrieved_snippets:
#             return jsonify({"answer": "Sorry, I couldn't find relevant information. Please try asking differently."})

#         # Generate an answer with the LLM augmented by retrieved context
#         answer = generate_answer(retrieved_snippets, user_question)
#         return jsonify({"answer": answer})

#     except Exception as e:
#         return jsonify({"answer": f"An error occurred while processing your question: {str(e)}"}), 500


@app.route("/api/qa", methods=["POST"])
def qa():
    user_question = request.json.get("question", "").strip()
    if not user_question:
        return jsonify({"error": "Empty question"}), 400

    try:
        # Normalize question text
        query = user_question.lower()

        # Retrieve top relevant snippets from RAG
        retrieved_snippets = query_similar_texts(query, top_k=5)

        # Fallback: If no snippets retrieved, try simple keyword search in knowledge base + observations
        if not retrieved_snippets:
            kb = load_knowledge_base()
            obs_notes = [obs.get("notes", "") for obs in observations if obs.get("notes")]
            all_texts = kb + obs_notes

            keywords = re.findall(r"\w+", query)
            retrieved_snippets = []
            for text in all_texts:
                if any(kw in text.lower() for kw in keywords):
                    retrieved_snippets.append(text)
            retrieved_snippets = retrieved_snippets[:5]

        # If still empty, respond politely
        if not retrieved_snippets:
            return jsonify({"answer": "Sorry, I couldn't find relevant information. Please try asking differently."})

        # Generate an answer with the LLM augmented by retrieved context
        answer = generate_answer(retrieved_snippets, user_question)
        
        # Extract known locations from the answer
        known_locations = [
            "Margalla Hills", "Rawal Lake", "Shakarparian", "Pir Sohawa",
            "Daman-e-Koh", "Faisal Mosque", "Saidpur Village", "Trail 1", 
            "Trail 2", "Trail 3", "Trail 4", "Trail 5", "Rawal Dam",
            "Shah Allah Ditta Caves", "Zoo vicinity", "Islamabad University Forest Area"
        ]
        
        mentioned_locations = []
        for location in known_locations:
            if location.lower() in answer.lower():
                mentioned_locations.append(location)
        
        return jsonify({
            "answer": answer,
            "locations": mentioned_locations
        })

    except Exception as e:
        return jsonify({"answer": f"An error occurred while processing your question: {str(e)}"}), 500
    

    
@app.route("/api/gamification", methods=["GET"])
def gamification():
    from collections import Counter
    cnt = Counter(obs.get("observer", "Anonymous") for obs in observations)
    if not cnt:
        return jsonify({"top_observer": "None", "submissions": 0})
    top, num = cnt.most_common(1)[0]
    return jsonify({"top_observer": top, "submissions": num})

@app.route("/api/analytics", methods=["GET"])
def analytics():
    obs = observations  # In-memory observations list
    
    # Total observations
    total_obs = len(obs)
    
    # Top 5 observers by submissions
    observer_counts = Counter(o.get("observer", "Anonymous") for o in obs)
    top_observers = observer_counts.most_common(5)
    
    # Top 5 species observed (by common_name + species_name)
    species_counts = Counter(
        f"{o.get('common_name', 'Unknown')} ({o.get('species_name', 'Unknown')})" for o in obs
    )
    top_species = species_counts.most_common(5)
    
    # Top 5 popular locations
    location_counts = Counter(o.get("location", "Unknown") for o in obs)
    top_locations = location_counts.most_common(5)
    
    return jsonify({
        "total_observations": total_obs,
        "top_observers": [{"observer": o, "count": c} for o, c in top_observers],
        "top_species": [{"species": s, "count": c} for s, c in top_species],
        "top_locations": [{"location": l, "count": c} for l, c in top_locations],
    })

@app.route("/api/user/stats/<username>", methods=["GET"])
def get_user_stats(username):
    """
    Returns detailed statistics for a specific user.
    Includes observation counts, species diversity, rewards, and rank.
    """
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    try:
        # Filter observations by the specified user
        user_observations = [obs for obs in observations 
                             if obs.get("observer", "").lower() == username.lower()]
        
        # Calculate all other users statistics for comparison/ranking
        all_users = Counter([obs.get("observer", "Anonymous") for obs in observations])
        user_ranks = sorted(all_users.items(), key=lambda x: x[1], reverse=True)
        
        # Find user's rank
        user_rank = next((idx + 1 for idx, (name, _) in enumerate(user_ranks) 
                          if name.lower() == username.lower()), 0)
        
        # Get unique species observed by user
        unique_species = len(set(obs.get("species_name", "") for obs in user_observations))
        
        # Calculate unique locations visited
        unique_locations = len(set(obs.get("location", "") for obs in user_observations))
        
        # Calculate observation frequency (last 30 days)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        recent_observations = len([
            obs for obs in user_observations 
            if obs.get("date_observed", "") >= thirty_days_ago
        ])
        
        # Calculate rewards and badges
        rewards = calculate_user_rewards(username, user_observations, all_users, user_rank)
        
        # Monthly contribution trends
        monthly_trends = calculate_monthly_trends(username, observations)
        
        # Popular species and locations for this user
        species_counts = Counter([obs.get("common_name", "Unknown") for obs in user_observations])
        location_counts = Counter([obs.get("location", "Unknown") for obs in user_observations])
        
        return jsonify({
            "username": username,
            "total_observations": len(user_observations),
            "unique_species": unique_species,
            "unique_locations": unique_locations,
            "recent_observations": recent_observations,
            "rank": user_rank,
            "total_users": len(all_users),
            "rewards": rewards,
            "monthly_trends": monthly_trends,
            "top_species": [{"name": name, "count": count} 
                           for name, count in species_counts.most_common(5)],
            "top_locations": [{"name": loc, "count": count} 
                             for loc, count in location_counts.most_common(5)]
        })
    
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve user stats: {str(e)}"}), 500


def calculate_user_rewards(username, user_observations, all_users, user_rank):
    """Helper function to calculate rewards and badges for a user"""
    rewards = []
    
    # Number of observations rewards
    obs_count = len(user_observations)
    if obs_count >= 50:
        rewards.append({
            "id": "obs-master",
            "name": "Observation Master",
            "description": "Contributed 50+ observations",
            "icon": "🔍",
            "level": 3
        })
    elif obs_count >= 25:
        rewards.append({
            "id": "obs-expert",
            "name": "Observation Expert",
            "description": "Contributed 25+ observations",
            "icon": "🔍",
            "level": 2
        })
    elif obs_count >= 10:
        rewards.append({
            "id": "obs-enthusiast",
            "name": "Observation Enthusiast",
            "description": "Contributed 10+ observations",
            "icon": "🔍",
            "level": 1
        })
    
    # Species diversity rewards
    unique_species = len(set(obs.get("species_name", "") for obs in user_observations))
    if unique_species >= 30:
        rewards.append({
            "id": "species-master",
            "name": "Species Diversity Master",
            "description": "Observed 30+ different species",
            "icon": "🦉",
            "level": 3
        })
    elif unique_species >= 15:
        rewards.append({
            "id": "species-explorer",
            "name": "Species Explorer",
            "description": "Observed 15+ different species",
            "icon": "🦉",
            "level": 2
        })
    elif unique_species >= 5:
        rewards.append({
            "id": "species-novice",
            "name": "Species Novice",
            "description": "Observed 5+ different species",
            "icon": "🦉",
            "level": 1
        })
    
    # Location explorer rewards
    unique_locations = len(set(obs.get("location", "") for obs in user_observations))
    if unique_locations >= 10:
        rewards.append({
            "id": "location-master",
            "name": "Location Master Explorer",
            "description": "Visited 10+ different locations",
            "icon": "🗺️",
            "level": 3
        })
    elif unique_locations >= 5:
        rewards.append({
            "id": "location-explorer",
            "name": "Location Explorer",
            "description": "Visited 5+ different locations",
            "icon": "🗺️",
            "level": 2
        })
    elif unique_locations >= 3:
        rewards.append({
            "id": "location-visitor",
            "name": "Location Visitor",
            "description": "Visited 3+ different locations",
            "icon": "🗺️",
            "level": 1
        })
    
    # Ranking rewards
    if user_rank == 1:
        rewards.append({
            "id": "top-contributor",
            "name": "Top Contributor",
            "description": "Ranked #1 in the community",
            "icon": "🏆",
            "level": 3
        })
    elif user_rank <= 3:
        rewards.append({
            "id": "elite-contributor",
            "name": "Elite Contributor",
            "description": "Ranked in the top 3",
            "icon": "🏆",
            "level": 2
        })
    elif user_rank <= 10:
        rewards.append({
            "id": "top-ten",
            "name": "Top 10 Contributor",
            "description": "Ranked in the top 10",
            "icon": "🏆",
            "level": 1
        })
    
    # Consistency reward
    dates = [obs.get("date_observed", "") for obs in user_observations]
    consecutive_days = calculate_consecutive_days(dates)
    if consecutive_days >= 7:
        rewards.append({
            "id": "weekly-streak",
            "name": "Weekly Streak",
            "description": f"Observed on {consecutive_days} consecutive days",
            "icon": "🔥",
            "level": 2
        })
    elif consecutive_days >= 3:
        rewards.append({
            "id": "mini-streak",
            "name": "Mini Streak",
            "description": f"Observed on {consecutive_days} consecutive days",
            "icon": "🔥",
            "level": 1
        })
    
    return rewards


def calculate_consecutive_days(dates):
    """Helper function to calculate the longest streak of consecutive days"""
    if not dates:
        return 0
    
    sorted_dates = sorted(filter(None, dates))
    if not sorted_dates:
        return 0
    
    # Convert strings to datetime objects
    date_objects = [datetime.strptime(date, "%Y-%m-%d") for date in sorted_dates]
    
    max_streak = current_streak = 1
    for i in range(1, len(date_objects)):
        # Check if dates are consecutive
        if (date_objects[i] - date_objects[i-1]).days == 1:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        elif (date_objects[i] - date_objects[i-1]).days > 1:
            current_streak = 1
    
    return max_streak


def calculate_monthly_trends(username, all_observations):
    """Calculate monthly observation counts for the past 6 months"""
    user_observations = [obs for obs in all_observations 
                         if obs.get("observer", "").lower() == username.lower()]
    
    # Get the last 6 months
    now = datetime.now()
    months = []
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=30*i)
        months.append(month_date.strftime("%Y-%m"))
    
    monthly_counts = {month: 0 for month in months}
    
    for obs in user_observations:
        date_str = obs.get("date_observed", "")
        if date_str:
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                month_key = date_obj.strftime("%Y-%m")
                if month_key in monthly_counts:
                    monthly_counts[month_key] += 1
            except ValueError:
                pass
    
    return [{"month": k, "count": v} for k, v in monthly_counts.items()]


@app.route("/api/community/leaderboard", methods=["GET"])
def get_community_leaderboard():
    """
    Returns the community leaderboard with top contributors
    and various achievement categories.
    """
    try:
        # Observations by user
        user_observations = Counter([obs.get("observer", "Anonymous") for obs in observations])
        top_observers = [{"name": name, "observations": count} 
                       for name, count in user_observations.most_common(10)]
        
        # Calculate species diversity by user
        species_by_user = defaultdict(set)
        for obs in observations:
            observer = obs.get("observer", "Anonymous")
            species = obs.get("species_name", "")
            if species:
                species_by_user[observer].add(species)
        
        species_diversity = [(user, len(species)) for user, species in species_by_user.items()]
        top_diversity = [{"name": name, "unique_species": count} 
                        for name, count in sorted(species_diversity, key=lambda x: x[1], reverse=True)[:10]]
        
        # Calculate locations by user
        locations_by_user = defaultdict(set)
        for obs in observations:
            observer = obs.get("observer", "Anonymous")
            location = obs.get("location", "")
            if location:
                locations_by_user[observer].add(location)
        
        location_explorers = [(user, len(locations)) for user, locations in locations_by_user.items()]
        top_explorers = [{"name": name, "unique_locations": count} 
                        for name, count in sorted(location_explorers, key=lambda x: x[1], reverse=True)[:10]]
        
        # Recent contributors (last 30 days)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        recent_observations = [obs for obs in observations 
                              if obs.get("date_observed", "") >= thirty_days_ago]
        recent_contributors = Counter([obs.get("observer", "Anonymous") for obs in recent_observations])
        top_recent = [{"name": name, "recent_observations": count} 
                     for name, count in recent_contributors.most_common(10)]
        
        return jsonify({
            "top_observers": top_observers,
            "species_diversity": top_diversity,
            "location_explorers": top_explorers,
            "recent_contributors": top_recent,
            "total_community_observations": len(observations),
            "total_users": len(user_observations)
        })
    
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve leaderboard: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
