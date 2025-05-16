import { MongoClient, ServerApiVersion, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/bioscout";

// Create a MongoClient with connection pooling
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db: Db;

async function connectToDatabase() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected successfully to MongoDB server");
    
    // Get the database
    db = client.db("bioscout");
    
    // Create indexes for geospatial queries on observations collection
    await db.collection("observations").createIndex({ "location": "2dsphere" });
    
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Please call connectToDatabase first.");
  }
  return db;
}

process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error while closing MongoDB connection:', err);
    process.exit(1);
  }
});

export { connectToDatabase, getDb };