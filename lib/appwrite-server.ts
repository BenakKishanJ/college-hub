// lib/appwrite-server.ts
import { Client, Databases } from "node-appwrite";

// Check if all required environment variables are present
const requiredEnvVars = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_USERS_COLLECTION_ID",
  "APPWRITE_DOCUMENTS_COLLECTION_ID",
  "APPWRITE_NOTIFICATIONS_COLLECTION_ID",
  "APPWRITE_APP_CONFIG_COLLECTION_ID",
  "APPWRITE_API_KEY",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  process.exit(1);
}

export const APPWRITE_CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  collections: {
    users: process.env.APPWRITE_USERS_COLLECTION_ID!,
    documents: process.env.APPWRITE_DOCUMENTS_COLLECTION_ID!,
    notifications: process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    appConfig: process.env.APPWRITE_APP_CONFIG_COLLECTION_ID!,
  },
};

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)
  .setKey(process.env.APPWRITE_API_KEY!);

export const databases = new Databases(client);
