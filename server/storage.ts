import { ObjectId } from 'mongodb';
import { getDb } from './db';
import {
  User, userSchema,
  Observation, observationSchema,
  Species, speciesSchema,
  Knowledge, knowledgeSchema,
  Query, querySchema
} from '@shared/schema';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUserPoints(userId: string, pointsToAdd: number): Promise<User | null>;
  
  // Observation operations
  getAllObservations(): Promise<Observation[]>;
  getObservation(id: string): Promise<Observation | null>;
  getObservationsByUser(userId: string): Promise<Observation[]>;
  getObservationsNearLocation(longitude: number, latitude: number, maxDistanceInMeters: number): Promise<Observation[]>;
  createObservation(observationData: Omit<Observation, 'createdAt' | 'updatedAt'>): Promise<Observation>;
  
  // Species operations
  getAllSpecies(): Promise<Species[]>;
  getSpecies(scientificName: string): Promise<Species | null>;
  getSpeciesByCommonName(commonName: string): Promise<Species | null>;
  createSpecies(speciesData: Omit<Species, 'createdAt' | 'updatedAt'>): Promise<Species>;
  
  // Knowledge operations
  getAllKnowledge(): Promise<Knowledge[]>;
  getKnowledge(id: string): Promise<Knowledge | null>;
  getKnowledgeByTitle(title: string): Promise<Knowledge | null>;
  createKnowledge(knowledgeData: Omit<Knowledge, 'createdAt' | 'updatedAt'>): Promise<Knowledge>;
  
  // Query operations
  createQuery(queryData: Omit<Query, 'createdAt'>): Promise<Query>;
  getQueriesByUser(userId: string): Promise<Query[]>;
}

export class MongoDBStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | null> {
    try {
      const db = getDb();
      const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
      return user as User | null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const db = getDb();
      const user = await db.collection('users').findOne({ email });
      return user as User | null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
  
  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const db = getDb();
      const now = new Date();
      const newUser = {
        ...userData,
        createdAt: now,
        updatedAt: now
      };
      
      const result = await db.collection('users').insertOne(newUser);
      return { ...newUser, _id: result.insertedId } as unknown as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUserPoints(userId: string, pointsToAdd: number): Promise<User | null> {
    try {
      const db = getDb();
      const result = await db.collection('users').findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { 
          $inc: { points: pointsToAdd },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );
      
      return result.value as User | null;
    } catch (error) {
      console.error('Error updating user points:', error);
      return null;
    }
  }
  
  // Observation operations
  async getAllObservations(): Promise<Observation[]> {
    try {
      const db = getDb();
      const observations = await db.collection('observations').find({}).toArray();
      return observations as Observation[];
    } catch (error) {
      console.error('Error getting all observations:', error);
      return [];
    }
  }
  
  async getObservation(id: string): Promise<Observation | null> {
    try {
      const db = getDb();
      const observation = await db.collection('observations').findOne({ _id: new ObjectId(id) });
      return observation as Observation | null;
    } catch (error) {
      console.error('Error getting observation:', error);
      return null;
    }
  }
  
  async getObservationsByUser(userId: string): Promise<Observation[]> {
    try {
      const db = getDb();
      const observations = await db.collection('observations').find({ userId }).toArray();
      return observations as Observation[];
    } catch (error) {
      console.error('Error getting observations by user:', error);
      return [];
    }
  }
  
  async getObservationsNearLocation(longitude: number, latitude: number, maxDistanceInMeters: number): Promise<Observation[]> {
    try {
      const db = getDb();
      const observations = await db.collection('observations').find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: maxDistanceInMeters
          }
        }
      }).toArray();
      
      return observations as Observation[];
    } catch (error) {
      console.error('Error getting observations near location:', error);
      return [];
    }
  }
  
  async createObservation(observationData: Omit<Observation, 'createdAt' | 'updatedAt'>): Promise<Observation> {
    try {
      const db = getDb();
      const now = new Date();
      const newObservation = {
        ...observationData,
        createdAt: now,
        updatedAt: now
      };
      
      const result = await db.collection('observations').insertOne(newObservation);
      return { ...newObservation, _id: result.insertedId } as unknown as Observation;
    } catch (error) {
      console.error('Error creating observation:', error);
      throw error;
    }
  }
  
  // Species operations
  async getAllSpecies(): Promise<Species[]> {
    try {
      const db = getDb();
      const species = await db.collection('species').find({}).toArray();
      return species as Species[];
    } catch (error) {
      console.error('Error getting all species:', error);
      return [];
    }
  }
  
  async getSpecies(scientificName: string): Promise<Species | null> {
    try {
      const db = getDb();
      const species = await db.collection('species').findOne({ scientificName });
      return species as Species | null;
    } catch (error) {
      console.error('Error getting species:', error);
      return null;
    }
  }
  
  async getSpeciesByCommonName(commonName: string): Promise<Species | null> {
    try {
      const db = getDb();
      const species = await db.collection('species').findOne({ commonNames: commonName });
      return species as Species | null;
    } catch (error) {
      console.error('Error getting species by common name:', error);
      return null;
    }
  }
  
  async createSpecies(speciesData: Omit<Species, 'createdAt' | 'updatedAt'>): Promise<Species> {
    try {
      const db = getDb();
      const now = new Date();
      const newSpecies = {
        ...speciesData,
        createdAt: now,
        updatedAt: now
      };
      
      const result = await db.collection('species').insertOne(newSpecies);
      return { ...newSpecies, _id: result.insertedId } as unknown as Species;
    } catch (error) {
      console.error('Error creating species:', error);
      throw error;
    }
  }
  
  // Knowledge operations
  async getAllKnowledge(): Promise<Knowledge[]> {
    try {
      const db = getDb();
      const knowledge = await db.collection('knowledge').find({}).toArray();
      return knowledge as Knowledge[];
    } catch (error) {
      console.error('Error getting all knowledge:', error);
      return [];
    }
  }
  
  async getKnowledge(id: string): Promise<Knowledge | null> {
    try {
      const db = getDb();
      const knowledge = await db.collection('knowledge').findOne({ _id: new ObjectId(id) });
      return knowledge as Knowledge | null;
    } catch (error) {
      console.error('Error getting knowledge:', error);
      return null;
    }
  }
  
  async getKnowledgeByTitle(title: string): Promise<Knowledge | null> {
    try {
      const db = getDb();
      const knowledge = await db.collection('knowledge').findOne({ title });
      return knowledge as Knowledge | null;
    } catch (error) {
      console.error('Error getting knowledge by title:', error);
      return null;
    }
  }
  
  async createKnowledge(knowledgeData: Omit<Knowledge, 'createdAt' | 'updatedAt'>): Promise<Knowledge> {
    try {
      const db = getDb();
      const now = new Date();
      const newKnowledge = {
        ...knowledgeData,
        createdAt: now,
        updatedAt: now
      };
      
      const result = await db.collection('knowledge').insertOne(newKnowledge);
      return { ...newKnowledge, _id: result.insertedId } as unknown as Knowledge;
    } catch (error) {
      console.error('Error creating knowledge:', error);
      throw error;
    }
  }
  
  // Query operations
  async createQuery(queryData: Omit<Query, 'createdAt'>): Promise<Query> {
    try {
      const db = getDb();
      const now = new Date();
      const newQuery = {
        ...queryData,
        createdAt: now
      };
      
      const result = await db.collection('queries').insertOne(newQuery);
      return { ...newQuery, _id: result.insertedId } as unknown as Query;
    } catch (error) {
      console.error('Error creating query:', error);
      throw error;
    }
  }
  
  async getQueriesByUser(userId: string): Promise<Query[]> {
    try {
      const db = getDb();
      const queries = await db.collection('queries').find({ userId }).toArray();
      return queries as Query[];
    } catch (error) {
      console.error('Error getting queries by user:', error);
      return [];
    }
  }
}

export const storage = new MongoDBStorage();