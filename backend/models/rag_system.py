import os
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import pandas as pd
from langchain.vectorstores import MongoDBAtlasVectorSearch
from langchain.document_loaders import TextLoader, CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import TensorflowHubEmbeddings
from langchain.schema import Document
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate

class RAGSystem:
    """
    Retrieval-Augmented Generation system for biodiversity information
    """
    def __init__(self, db):
        """Initialize with database connection"""
        self.db = db
        self.embedding_model_url = "https://tfhub.dev/google/universal-sentence-encoder/4"
        self.embeddings = TensorflowHubEmbeddings(model_url=self.embedding_model_url)
        self.vector_store = None
        self.initialize_vector_store()
        
        # Data paths
        self.data_dir = "data/rag_data"
        os.makedirs(self.data_dir, exist_ok=True)
        
    def initialize_vector_store(self):
        """Initialize the vector store with MongoDB Atlas"""
        self.vector_store = MongoDBAtlasVectorSearch(
            collection=self.db.rag_documents,
            embedding=self.embeddings,
            index_name="vector_index",
            text_key="content",
            embedding_key="embedding"
        )
    
    def process_csv_data(self, csv_path: str) -> List[Document]:
        """Process CSV data into documents for indexing"""
        try:
            # Load the CSV file
            df = pd.read_csv(csv_path)
            
            # Create documents from the rows
            documents = []
            
            for _, row in df.iterrows():
                # Create content from the row data
                content = f"""
                Species: {row.get('species_name', '')}
                Common Name: {row.get('common_name', '')}
                Date Observed: {row.get('date_observed', '')}
                Location: {row.get('location', '')}
                Notes: {row.get('notes', '')}
                Observer: {row.get('observer', '')}
                """
                
                # Create metadata
                metadata = {
                    "source": csv_path,
                    "observation_id": row.get('observation_id', ''),
                    "species_name": row.get('species_name', ''),
                    "date_observed": row.get('date_observed', ''),
                    "location": row.get('location', '')
                }
                
                # Create document
                doc = Document(
                    page_content=content,
                    metadata=metadata
                )
                
                documents.append(doc)
            
            return documents
        
        except Exception as e:
            print(f"Error processing CSV data: {str(e)}")
            return []
    
    def update_embeddings(self):
        """Update embeddings for all documents in the rag_documents collection"""
        try:
            # Get all documents without embeddings
            docs_without_embeddings = list(self.db.rag_documents.find({"embedding": None}))
            
            if not docs_without_embeddings:
                print("No documents requiring embedding updates found.")
                return
            
            print(f"Updating embeddings for {len(docs_without_embeddings)} documents...")
            
            for doc in docs_without_embeddings:
                # Generate embedding
                content = doc.get("content", "")
                if not content:
                    continue
                
                embedding = self.embeddings.embed_query(content)
                
                # Update the document with the embedding
                self.db.rag_documents.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"embedding": embedding}}
                )
            
            print("Embedding update completed.")
            
        except Exception as e:
            print(f"Error updating embeddings: {str(e)}")
    
    def answer_question(self, question: str) -> Dict[str, Any]:
        """
        Answer a question about biodiversity using RAG
        
        Args:
            question: The question to answer
            
        Returns:
            Dict containing the answer and related information
        """
        try:
            # Make sure all documents have embeddings
            self.update_embeddings()
            
            # Create a QA chain with the vector store
            retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 5}  # Retrieve top 5 most relevant documents
            )
            
            # Create custom prompt template for biodiversity Q&A
            prompt_template = """
            You are an expert on biodiversity in Islamabad, Pakistan. Use the following pieces of context from the 
            biodiversity database to answer the question. If you don't know the answer, just say 
            "I don't have enough information to answer this question" - don't make up an answer.
            
            Context:
            {context}
            
            Question: {question}
            
            Answer:
            """
            
            PROMPT = PromptTemplate(
                template=prompt_template,
                input_variables=["context", "question"]
            )
            
            # For local processing without OpenAI, can use a different LLM implementation here
            # or even a simple retrieval + templating approach
            
            # Get relevant documents from the vector store
            docs = retriever.get_relevant_documents(question)
            
            # Extract the relevant information
            context_text = "\n\n".join([doc.page_content for doc in docs])
            
            # Generate suggested questions
            suggested_questions = self._generate_follow_up_questions(question, docs)
            
            # Get related species IDs from the retrieved documents
            related_species_ids = []
            sources_used = []
            
            for doc in docs:
                # Extract species name from metadata
                species_name = doc.metadata.get("species_name")
                if species_name and species_name not in [s.get("name") for s in related_species_ids]:
                    # Get species info
                    species_info = self.db.species.find_one({"scientific_name": species_name})
                    if species_info:
                        related_species_ids.append({
                            "id": str(species_info.get("_id")),
                            "name": species_name,
                            "type": species_info.get("type", "unknown")
                        })
                
                # Add source
                source = doc.metadata.get("source", "biodiversity database")
                if source and source not in sources_used:
                    sources_used.append(source)
            
            # Simple templated answer for now - in a production system, use a real LLM
            answer = self._generate_templated_answer(question, context_text)
            
            # Track this question in the queries collection
            self.db.queries.insert_one({
                "question": question,
                "answer": answer,
                "sources_used": sources_used,
                "related_species_ids": [rs["id"] for rs in related_species_ids],
                "timestamp": datetime.now()
            })
            
            return {
                "text": answer,
                "sources": sources_used,
                "related_species_ids": related_species_ids,
                "suggested_questions": suggested_questions
            }
            
        except Exception as e:
            print(f"Error answering question: {str(e)}")
            return {
                "text": "I'm sorry, I encountered an error while trying to answer your question.",
                "sources": [],
                "related_species_ids": [],
                "suggested_questions": [
                    "What birds are commonly found in Islamabad?",
                    "What are the endangered species in Pakistan?",
                    "How does seasonal change affect biodiversity in Islamabad?"
                ]
            }
    
    def _generate_templated_answer(self, question: str, context: str) -> str:
        """
        Generate a templated answer for demonstration purposes.
        In a production system, this would use a language model.
        """
        if not context:
            return "I don't have enough information in my database to answer this question about Islamabad's biodiversity."
        
        # Basic keyword matching for demonstration purposes
        question_lower = question.lower()
        
        if "bird" in question_lower or "birds" in question_lower:
            return f"Based on observations in our database, Islamabad has a diverse bird population. {context}"
        
        if "endangered" in question_lower:
            return f"Regarding endangered species in Islamabad: {context}"
        
        if "reptile" in question_lower or "reptiles" in question_lower:
            return f"About reptiles in the Islamabad region: {context}"
        
        if "plant" in question_lower or "plants" in question_lower or "tree" in question_lower or "trees" in question_lower:
            return f"Regarding the plant life in Islamabad: {context}"
        
        if "location" in question_lower or "where" in question_lower or "habitat" in question_lower:
            return f"About biodiversity locations in Islamabad: {context}"
        
        # General response
        return f"Here's information about biodiversity in Islamabad based on our observations: {context}"
    
    def _generate_follow_up_questions(self, question: str, docs: List[Document]) -> List[str]:
        """
        Generate follow-up questions based on the current question and retrieved documents.
        """
        suggested_questions = []
        
        # Extract species mentioned in the retrieved documents
        species_mentioned = []
        locations_mentioned = []
        
        for doc in docs:
            species_name = doc.metadata.get("species_name")
            if species_name and species_name not in species_mentioned:
                species_mentioned.append(species_name)
            
            location = doc.metadata.get("location")
            if location and location not in locations_mentioned:
                locations_mentioned.append(location)
        
        # Generate species-specific questions
        for species in species_mentioned[:2]:  # Limit to first 2 to avoid too many questions
            suggested_questions.append(f"What is the habitat of {species}?")
            suggested_questions.append(f"When is {species} commonly observed in Islamabad?")
        
        # Generate location-specific questions
        for location in locations_mentioned[:2]:
            suggested_questions.append(f"What other species can be found in {location}?")
        
        # Add some general questions
        general_questions = [
            "What are the most endangered species in Islamabad?",
            "How has urbanization affected biodiversity in Islamabad?",
            "What conservation efforts are underway in Islamabad?",
            "What are the seasonal patterns of wildlife in Islamabad?",
            "Which areas in Islamabad have the highest biodiversity?"
        ]
        
        # Select a few general questions
        import random
        selected_general = random.sample(general_questions, min(2, len(general_questions)))
        suggested_questions.extend(selected_general)
        
        # Limit to 5 questions
        return suggested_questions[:5]
    
    def create_csv_from_observations(self) -> str:
        """
        Creates a CSV file from the observations in the database for RAG processing
        
        Returns:
            Path to the created CSV file
        """
        try:
            # Get all observations
            observations = list(self.db.observations.find())
            
            if not observations:
                print("No observations found in the database.")
                return ""
            
            # Create a dataframe
            data = []
            
            for obs in observations:
                # Format common names as comma-separated string
                common_names_str = ", ".join(obs.get("common_names", []))
                
                # Format date
                date_str = obs.get("date_observed").strftime("%m/%d/%Y") if obs.get("date_observed") else ""
                
                data.append({
                    "observation_id": obs.get("observation_id", ""),
                    "species_name": obs.get("species_name", ""),
                    "common_name": common_names_str,
                    "date_observed": date_str,
                    "location": obs.get("location", ""),
                    "image_url": obs.get("image_url", ""),
                    "notes": obs.get("notes", ""),
                    "observer": obs.get("observer", "")
                })
            
            # Create dataframe and export to CSV
            df = pd.DataFrame(data)
            
            # Create filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_path = os.path.join(self.data_dir, f"observations_{timestamp}.csv")
            
            # Save to CSV
            df.to_csv(file_path, index=False)
            
            print(f"Created CSV file with {len(data)} observations at {file_path}")
            return file_path
            
        except Exception as e:
            print(f"Error creating CSV from observations: {str(e)}")
            return ""
    
    def update_rag_from_csv(self, csv_path: Optional[str] = None) -> bool:
        """
        Update the RAG system with data from a CSV file
        
        Args:
            csv_path: Path to the CSV file, if None, will generate from database
            
        Returns:
            Success status
        """
        try:
            # If no CSV path provided, create one from observations
            if not csv_path:
                csv_path = self.create_csv_from_observations()
                
                if not csv_path:
                    print("Failed to create CSV file.")
                    return False
            
            # Process the CSV into documents
            documents = self.process_csv_data(csv_path)
            
            if not documents:
                print("No documents extracted from CSV.")
                return False
            
            print(f"Extracted {len(documents)} documents from CSV.")
            
            # Import documents into the rag_documents collection
            for doc in documents:
                # Check if a document for this observation already exists
                existing = None
                if "observation_id" in doc.metadata:
                    existing = self.db.rag_documents.find_one({
                        "metadata.observation_id": doc.metadata["observation_id"]
                    })
                
                if existing:
                    # Update existing document
                    self.db.rag_documents.update_one(
                        {"_id": existing["_id"]},
                        {
                            "$set": {
                                "content": doc.page_content,
                                "metadata": doc.metadata,
                                "embedding": None,  # Will be computed later
                                "updated_at": datetime.now()
                            }
                        }
                    )
                else:
                    # Create new document
                    self.db.rag_documents.insert_one({
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "embedding": None,  # Will be computed later
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    })
            
            # Update embeddings
            self.update_embeddings()
            
            return True
            
        except Exception as e:
            print(f"Error updating RAG from CSV: {str(e)}")
            return False