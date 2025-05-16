# BioScout Islamabad Architecture

## System Components

1. **Frontend (React)**
   - User Interface for observation submission
   - Map visualization using Leaflet
   - Image upload interface
   - Chat interface for RAG system
   - User authentication and profile management

2. **Backend (Node.js/Express)**
   - API endpoints for CRUD operations
   - Image processing and identification service
   - RAG-based chatbot system
   - Authentication middleware
   - MongoDB connection and data management

3. **Database (MongoDB)**
   - Users collection: user profiles, points/rewards
   - Observations collection: animal/plant sightings with location data
   - Species collection: information about identified species
   - Knowledge collection: curated information for RAG system

4. **Computer Vision System**
   - Local TensorFlow.js model for image classification
   - Pre-trained models for plant and animal identification
   - No reliance on paid external APIs

5. **RAG System**
   - Local vector database for storing knowledge embeddings
   - Integration with free text-generation models
   - Fallback to local information when internet is unavailable

## Data Flow

1. User uploads an image of a plant/animal with location data
2. Backend processes the image using TensorFlow.js model
3. Identified species is stored in MongoDB with location
4. User receives points/rewards based on uniqueness of submission
5. Other users can query the RAG system about the species
6. RAG system retrieves relevant information from database and internet
7. Users can view a map of all sightings for specific species

## Technical Stack

- Frontend: React, Leaflet for maps, TailwindCSS for styling
- Backend: Node.js, Express
- Database: MongoDB
- ML/AI: TensorFlow.js for image classification, LangChain for RAG system
- Authentication: JWT-based auth system

## System Diagram

```
┌─────────────┐     ┌────────────────┐     ┌──────────────┐
│             │     │                │     │              │
│  Frontend   │◄────┤    Backend     │◄────┤   MongoDB    │
│  (React)    │     │  (Node/Express)│     │  Database    │
│             │────►│                │────►│              │
└─────────────┘     └────────────────┘     └──────────────┘
                           ▲  ▲
                           │  │
                    ┌──────┘  └─────────┐
                    │                   │
             ┌──────────────┐    ┌──────────────┐
             │              │    │              │
             │ TensorFlow.js│    │   RAG System │
             │ (CV Model)   │    │  (LangChain) │
             │              │    │              │
             └──────────────┘    └──────────────┘
```