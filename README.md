# BioScout Islamabad

BioScout Islamabad is a collaborative wildlife tracking and research platform that enables users to identify, log, and analyze species observations across Islamabad's diverse ecological zones.

## Features

- **Species Identification**: Upload images to identify local plants and animals using computer vision
- **Geospatial Mapping**: Visualize wildlife sightings across Islamabad with interactive maps
- **Community Contributions**: Join the leaderboard and earn eco-friendly rewards for your observations
- **AI-Powered Knowledge**: Ask questions about local biodiversity with our RAG-based conversational system
- **Data Visualization**: Compare species and track biodiversity trends with interactive charts
- **Multiple Naming Support**: Access species by both scientific and local/common names

## Setup Instructions

### Prerequisites

- MongoDB database
- Python 3.10+ 
- Node.js 18+
- Required Python packages (installed via pip)
- Required Node.js packages (installed via npm)

### Environment Setup

1. Create a MongoDB database (local or cloud-based like MongoDB Atlas)
2. Set up the following environment variables:
   ```
   DATABASE_URL=mongodb://username:password@host:port/database
   SESSION_SECRET=your_session_secret
   ```

### Installation Steps

1. Clone the repository

2. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Create necessary directories:
   ```bash
   mkdir -p uploads
   ```

### Running the Application

1. Start the Python Flask backend:
   ```bash
   python app.py
   ```

2. In a separate terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

3. Access the application at `http://localhost:3000` (or the port specified in your terminal)

## Project Structure

```
├── backend/               # Python backend code
│   ├── db.py              # Database connection and utilities
│   ├── models/            # Data models and processing
│   │   ├── image_processor.py  # Image processing with TensorFlow
│   │   ├── observation.py      # Observation data model
│   │   ├── rag_system.py       # RAG conversational AI
│   │   └── species.py          # Species data model
│   └── routes/            # API routes
│       ├── auth_routes.py       # Authentication routes
│       ├── identify_routes.py   # Species identification
│       ├── leaderboard_routes.py  # Contribution leaderboard
│       ├── observation_routes.py  # Observation management
│       ├── rag_routes.py        # Question-answering system
│       └── species_routes.py    # Species information
├── client/                # React frontend
│   ├── public/            # Static assets
│   └── src/               # Source files
│       ├── components/    # UI components
│       ├── hooks/         # React hooks
│       ├── pages/         # Page components 
│       └── styles/        # CSS and styling
├── server/                # Express server (connects React and Python)
├── data/                  # Data storage and caching
├── uploads/               # Image uploads
└── app.py                 # Main application entry point
```

## Usage Guide

1. **Home Page**: Browse recent observations and species
2. **Identify**: Upload images to identify local flora and fauna
3. **Map**: Explore sightings across Islamabad with location filters
4. **Ask**: Query the conversational AI about local biodiversity 
5. **Leaderboard**: View top contributors and your eco-rewards
6. **My Observations**: Track your personal contributions

## Community Contribution Leaderboard

The leaderboard system awards points based on:

- First observation of a species: 25 points
- First observation in a new area: 15 points 
- Base observation: 10 points
- Verified observation bonus: 5 points

Users progress through ecological reward tiers as they accumulate points:
- **Seedling**: 0+ points - Digital certificate
- **Sapling**: 100+ points - Tree planting
- **Ranger**: 500+ points - Conservation event participation
- **Guardian**: 1000+ points - Guided tour + conservation kit
- **Steward**: 2500+ points - Named contributor + 5 trees planted
- **Sentinel**: 5000+ points - Featured recognition + habitat restoration

## Contributing

We welcome contributions to improve BioScout Islamabad! Please check the issues tab to see where you can help.

## License

This project is licensed under the MIT License - see the LICENSE file for details.