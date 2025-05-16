from flask import request, jsonify
from datetime import datetime
import json

def register_routes(bp, db, rag_system):
    @bp.route('/ask', methods=['POST'])
    def ask_rag():
        """
        Ask a question to the RAG system about biodiversity in Islamabad
        """
        try:
            # Get request data
            data = request.json
            
            # Validate request data
            if not data or 'question' not in data:
                return jsonify({"error": "Question is required"}), 400
                
            # Get user ID if available
            user_id = request.headers.get('Authorization')
            
            # Process question through RAG system
            user_question = data['question'].strip()
            
            # Retrieve relevant context for the question
            retrieved_snippets = query_similar_texts(user_question, top_k=5)
            
            # Generate answer using retrieved context
            answer = generate_answer(retrieved_snippets, user_question)
            
            # Save question and answer to database for history
            save_qa_to_history(db, user_question, answer, user_id)
            
            return jsonify({"answer": answer}), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @bp.route('/recent', methods=['GET'])
    def get_recent_questions():
        """
        Get recent questions from the QA history
        """
        try:
            # Get limit parameter from query string
            limit = request.args.get('limit', default=5, type=int)
            
            # Get user-specific questions if user ID is provided
            user_id = request.headers.get('Authorization')
            
            # Query database for recent questions
            query = {}
            if user_id:
                query['user_id'] = user_id
                
            # Get recent questions from database
            recent_questions = list(db.qa_history.find(
                query, 
                {'_id': 0, 'question': 1, 'answer': 1, 'timestamp': 1}
            ).sort('timestamp', -1).limit(limit))
            
            # Format timestamps to ISO format
            for item in recent_questions:
                if 'timestamp' in item and isinstance(item['timestamp'], datetime):
                    item['timestamp'] = item['timestamp'].isoformat()
            
            return jsonify(recent_questions), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500


            
    @bp.route('/history', methods=['GET'])
    def get_chat_history():
        """
        Get chat history for a user
        """
        try:
            # Get user ID from header
            user_id = request.headers.get('Authorization')
            
            if not user_id:
                return jsonify({"error": "User ID is required"}), 400
                
            # Get chat history from database
            chat_history_collection = db['chat_history']
            
            # Find chat history for user
            query = {"user_id": user_id} if user_id else {}
            
            # Get limit from query parameters
            try:
                limit = int(request.args.get('limit', 50))
            except ValueError:
                limit = 50
                
            # Query database
            chat_history = list(chat_history_collection.find(
                query,
                {'_id': 1, 'question': 1, 'answer': 1, 'created_at': 1}
            ).sort('created_at', -1).limit(limit))
            
            # Convert ObjectId to string
            for item in chat_history:
                item['id'] = str(item.pop('_id'))
                
            return jsonify(chat_history), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    @bp.route('/train', methods=['POST'])
    def train_rag():
        """
        Add new documents to the RAG system knowledge base
        """
        try:
            # Get request data
            data = request.json
            
            # Validate request data
            if not data or 'documents' not in data:
                return jsonify({"error": "Documents are required"}), 400
                
            documents = data['documents']
            
            # Validate documents
            if not isinstance(documents, list):
                return jsonify({"error": "Documents must be an array"}), 400
                
            for doc in documents:
                if 'text' not in doc or 'metadata' not in doc:
                    return jsonify({"error": "Each document must have 'text' and 'metadata' fields"}), 400
            
            # Train RAG system with new documents
            rag_system.train(documents)
            
            # Store knowledge sources in database
            knowledge_sources = []
            for doc in documents:
                if doc.get('metadata', {}).get('source_type') == 'knowledge':
                    # Extract metadata
                    metadata = doc.get('metadata', {})
                    
                    # Get title and content from text
                    text_lines = doc.get('text', '').split('\n')
                    title = metadata.get('title', '')
                    content = '\n'.join(text_lines)
                    
                    # Create knowledge source document
                    knowledge_source = {
                        "title": title,
                        "content": content,
                        "source": metadata.get('source'),
                        "species_references": metadata.get('species_references', []),
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    }
                    
                    knowledge_sources.append(knowledge_source)
            
            # Insert knowledge sources into database if any
            if knowledge_sources:
                db['knowledge_sources'].insert_many(knowledge_sources)
            
            return jsonify({
                "message": "RAG system trained successfully",
                "documents_count": len(documents),
                "knowledge_sources_added": len(knowledge_sources)
            }), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
def save_qa_to_history(db, question, answer, user_id=None):
    """Save question and answer to database for history tracking"""
    qa_history = {
        "question": question,
        "answer": answer,
        "timestamp": datetime.now(),
    }
    
    if user_id:
        qa_history["user_id"] = user_id
        
    db.qa_history.insert_one(qa_history)