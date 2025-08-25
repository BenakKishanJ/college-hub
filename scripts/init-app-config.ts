// scripts/init-app-config.ts
import dotenv from "dotenv";
import path from "path";
import { Client, Databases, Query } from "node-appwrite";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Check if all required environment variables are present
const requiredEnvVars = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_APP_CONFIG_COLLECTION_ID",
  "APPWRITE_API_KEY",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  process.exit(1);
}

const APPWRITE_CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  collections: {
    appConfig: process.env.APPWRITE_APP_CONFIG_COLLECTION_ID!,
  },
};

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

const initializeAppConfig = async () => {
  try {
    console.log("🔧 Initializing App Config...");

    // Check if config already exists
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.appConfig,
      [Query.limit(1)],
    );

    if (response.documents.length > 0) {
      console.log("✅ App config already exists");
      const latestConfig = response.documents[0];
      console.log("Latest config updated at:", latestConfig.code_last_updated);
      return;
    }

    // Create initial config with default hash
    const defaultSecretCode = "IamDraitian"; // Change this!
    const hashedCode = await bcrypt.hash(defaultSecretCode, 10);

    await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.appConfig,
      "unique()",
      {
        teacher_secret_code_hash: hashedCode,
        code_last_updated: new Date().toISOString(),
        config_name: "teacher_auth",
        description: "Initial teacher authentication configuration",
      },
    );

    console.log("✅ App config initialized successfully");
    console.log("Default secret code:", defaultSecretCode);
    console.log("⚠️  Remember to change the default secret code!");
  } catch (error) {
    console.error("❌ Error initializing app config:", error);
  }
};

// Run the initialization
initializeAppConfig();
