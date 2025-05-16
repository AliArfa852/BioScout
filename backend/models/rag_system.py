from typing import List, Dict, Any, Optional, Tuple
import os
import numpy as np
from datetime import datetime
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.embeddings import TensorflowEmbeddings
import tensorflow as tf
import tensorflow_hub as hub

class RAGSystem:
    """
    Retrieval-Augmented Generation system for the BioScout Islamabad application.
    This system will use a combination of local knowledge base and tensorflow embeddings
    to provide accurate information about species in Islamabad.
    """
    def __init__(self, db, model_path=None):
        self.db = db
        self.collections = {
            'species': db['species'],
            'observations': db['observations'],
            'knowledge_sources': db['knowledge_sources'],
            'chat_history': db['chat_history']
        }
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        
        # Initialize embedding model
        try:
            # Load model path from environment or use default
            self.model_path = model_path or os.environ.get('EMBEDDING_MODEL_PATH', 
                                                        "https://tfhub.dev/google/universal-sentence-encoder/4")
            
            # Load the TensorFlow model
            self.embedding_model = hub.load(self.model_path)
            print(f"Successfully loaded embedding model from {self.model_path}")
            
            # Initialize vector store if we have documents
            self.vector_store = None
            self.initialize_vector_store()
            
        except Exception as e:
            print(f"Error initializing embedding model: {e}")
            self.embedding_model = None
    
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts using the TensorFlow model
        """
        if not self.embedding_model:
            raise ValueError("Embedding model not initialized")
        
        embeddings = self.embedding_model(texts)
        return embeddings.numpy()
    
    def initialize_vector_store(self):
        """
        Initialize the vector store with documents from the database
        """
        # Get all documents from the database
        species_data = list(self.collections['species'].find({}))
        knowledge_sources = list(self.collections['knowledge_sources'].find({}))
        
        # Create documents from species data
        documents = []
        for species in species_data:
            # Create a document for each species
            species_text = f"Scientific Name: {species.get('scientific_name')}\n" \
                          f"Common Names: {', '.join(species.get('common_names', []))}\n" \
                          f"Type: {species.get('type')}\n" \
                          f"Description: {species.get('description')}\n" \
                          f"Habitat: {species.get('habitat')}\n"
            
            if species.get('conservation_status'):
                species_text += f"Conservation Status: {species.get('conservation_status')}\n"
            
            if species.get('dietary_habits'):
                species_text += f"Dietary Habits: {species.get('dietary_habits')}\n"
            
            metadata = {
                "source_type": "species",
                "id": str(species.get('_id')),
                "scientific_name": species.get('scientific_name'),
                "common_names": species.get('common_names', [])
            }
            
            documents.append({"text": species_text, "metadata": metadata})
        
        # Add knowledge source documents
        for source in knowledge_sources:
            source_text = f"Title: {source.get('title')}\n" \
                         f"Content: {source.get('content')}\n"
            
            if source.get('source'):
                source_text += f"Source: {source.get('source')}\n"
            
            metadata = {
                "source_type": "knowledge",
                "id": str(source.get('_id')),
                "title": source.get('title'),
                "species_references": source.get('species_references', [])
            }
            
            documents.append({"text": source_text, "metadata": metadata})
        
        if not documents:
            print("No documents found in the database for vector store initialization")
            return
        
        # Split documents into chunks for better retrieval
        all_texts = []
        all_metadatas = []
        
        for doc in documents:
            chunks = self.text_splitter.split_text(doc["text"])
            all_texts.extend(chunks)
            all_metadatas.extend([doc["metadata"]] * len(chunks))
        
        # Generate embeddings and create vector store
        embeddings = self.embed_texts(all_texts)
        
        # Create FAISS index
        self.vector_store = FAISS(embedding_function=self.embed_texts, 
                                  texts=all_texts, 
                                  metadatas=all_metadatas)
        print(f"Vector store initialized with {len(all_texts)} document chunks")
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for relevant documents given a query
        """
        if not self.vector_store:
            raise ValueError("Vector store not initialized")
        
        # Generate query embedding
        query_embedding = self.embed_texts([query])[0]
        
        # Search vector store
        results = self.vector_store.similarity_search_by_vector(
            query_embedding, k=k
        )
        
        return results
    
    def ask(self, question: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Answer a question using RAG
        Return format: {"answer": str, "sources": List[str]}
        """
        # Search for relevant documents
        try:
            results = self.search(question, k=5)
            
            # Construct context from retrieved documents
            context = "\n\n".join([r.page_content for r in results])
            
            # Get source information
            sources = []
            related_species_ids = []
            related_observation_ids = []
            
            for result in results:
                metadata = result.metadata
                source_type = metadata.get("source_type")
                
                if source_type == "species":
                    source_info = f"Species: {metadata.get('scientific_name')}"
                    related_species_ids.append(metadata.get('id'))
                elif source_type == "knowledge":
                    source_info = f"Knowledge Source: {metadata.get('title')}"
                    if 'species_references' in metadata:
                        related_species_ids.extend(metadata.get('species_references'))
                else:
                    source_info = f"Source: {metadata.get('id')}"
                
                if source_info not in sources:
                    sources.append(source_info)
            
            # Here we would typically call an LLM to generate the answer
            # Since we're not using external APIs, we'll construct a simple answer
            # from the retrieved documents
            
            # In a real implementation, you'd use a local LLM or LangChain
            answer = self._generate_simple_answer(question, context)
            
            # Store the question and answer in chat history
            self._save_chat_history(question, answer, user_id, related_species_ids, 
                                   related_observation_ids, sources)
            
            return {
                "answer": answer,
                "sources": sources
            }
        
        except Exception as e:
            print(f"Error in RAG system: {e}")
            return {
                "answer": f"I'm sorry, I couldn't process your question due to a technical issue. Please try again later.",
                "sources": []
            }
    
    def _generate_simple_answer(self, question: str, context: str) -> str:
        """
        Generate a simple answer from the context
        This is a fallback method when no LLM is available
        """
        # Extract relevant sentences that might contain the answer
        sentences = context.split('.')
        
        # Score sentences by relevance to the question
        question_words = set(question.lower().split())
        scored_sentences = []
        
        for sentence in sentences:
            if not sentence.strip():
                continue
                
            # Simple bag-of-words relevance score
            words = set(sentence.lower().split())
            overlap = question_words.intersection(words)
            score = len(overlap) / len(question_words) if question_words else 0
            
            scored_sentences.append((sentence, score))
        
        # Sort by relevance score
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        
        # Take top 3 most relevant sentences
        top_sentences = [s for s, _ in scored_sentences[:3]]
        
        # Join sentences to form the answer
        answer = '. '.join(top_sentences)
        
        if answer:
            return answer + '.'
        else:
            return "I don't have specific information about that in my knowledge base yet."
    
    def _save_chat_history(self, question: str, answer: str, user_id: Optional[str],
                          related_species_ids: List[str], related_observation_ids: List[str],
                          sources_used: List[str]):
        """
        Save the question and answer to chat history in MongoDB
        """
        chat_record = {
            "question": question,
            "answer": answer,
            "created_at": datetime.now(),
            "related_species_ids": related_species_ids,
            "related_observation_ids": related_observation_ids,
            "sources_used": sources_used
        }
        
        if user_id:
            chat_record["user_id"] = user_id
            
        self.collections['chat_history'].insert_one(chat_record)
        
    def train(self, documents: List[Dict[str, Any]]):
        """
        Train the RAG system with new documents
        Each document should have a "text" field and a "metadata" field
        """
        if not documents:
            return
            
        # Split documents into chunks
        all_texts = []
        all_metadatas = []
        
        for doc in documents:
            chunks = self.text_splitter.split_text(doc["text"])
            all_texts.extend(chunks)
            all_metadatas.extend([doc["metadata"]] * len(chunks))
        
        # Generate embeddings and create/update vector store
        embeddings = self.embed_texts(all_texts)
        
        if self.vector_store:
            # Update existing vector store
            for i, (text, metadata) in enumerate(zip(all_texts, all_metadatas)):
                self.vector_store.add_embeddings(
                    texts=[text],
                    embeddings=[embeddings[i]],
                    metadatas=[metadata]
                )
        else:
            # Create new vector store
            self.vector_store = FAISS(embedding_function=self.embed_texts, 
                                     texts=all_texts, 
                                     metadatas=all_metadatas)
                                     
        print(f"Vector store updated with {len(all_texts)} new document chunks")