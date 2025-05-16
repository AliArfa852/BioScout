import { z } from "zod";

// User Schema
export const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  profilePicture: z.string().optional(),
  points: z.number().default(0),
  role: z.enum(["user", "admin"]).default("user"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof userSchema>;

// Observation Schema
export const observationSchema = z.object({
  userId: z.string(),
  speciesName: z.string(),
  commonNames: z.array(z.string()).default([]),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
  }),
  imageUrl: z.string(),
  description: z.string().optional(),
  identificationConfidence: z.number().min(0).max(1).default(0.7),
  verified: z.boolean().default(false),
  pointsAwarded: z.number().default(10),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Observation = z.infer<typeof observationSchema>;

// Species Schema
export const speciesSchema = z.object({
  scientificName: z.string(),
  commonNames: z.array(z.string()).default([]),
  type: z.enum(["plant", "animal", "fungi", "other"]),
  description: z.string(),
  habitat: z.string(),
  imageUrls: z.array(z.string()).default([]),
  conservationStatus: z.string().optional(),
  isEndemic: z.boolean().default(false),
  dietaryHabits: z.string().optional(),
  seasonalPresence: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Species = z.infer<typeof speciesSchema>;

// Knowledge Base Schema for RAG system
export const knowledgeSchema = z.object({
  title: z.string(),
  content: z.string(),
  source: z.string().optional(),
  speciesReferences: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Knowledge = z.infer<typeof knowledgeSchema>;

// User Query Schema for RAG system logging
export const querySchema = z.object({
  userId: z.string().optional(),
  question: z.string(),
  answer: z.string(),
  relatedObservationIds: z.array(z.string()).default([]),
  relatedSpeciesIds: z.array(z.string()).default([]),
  sourcesUsed: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type Query = z.infer<typeof querySchema>;