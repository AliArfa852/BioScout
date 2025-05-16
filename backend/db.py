import os
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

# MongoDB connection
def init_db() -> Database:
    """
    Initialize MongoDB connection
    Returns a MongoDB database object
    """
    # Get MongoDB connection string from environment
    mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017')
    
    # Create a MongoDB client
    client = MongoClient(mongo_uri)
    
    # Get database name from environment or use default
    db_name = os.environ.get('MONGODB_DBNAME', 'bioscout')
    
    # Return database object
    return client[db_name]

def get_db() -> Database:
    """
    Get MongoDB database object
    """
    return init_db()

def get_collection(collection_name: str) -> Collection:
    """
    Get a MongoDB collection
    """
    db = get_db()
    return db[collection_name]