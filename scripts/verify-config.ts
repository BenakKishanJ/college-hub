// scripts/verify-config.ts
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const APPWRITE_CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT,
  projectId: process.env.APPWRITE_PROJECT_ID,
  databaseId: process.env.APPWRITE_DATABASE_ID,
  collections: {
    users: process.env.APPWRITE_USERS_COLLECTION_ID,
    documents: process.env.APPWRITE_DOCUMENTS_COLLECTION_ID,
    notifications: process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
    appConfig: process.env.APPWRITE_APP_CONFIG_COLLECTION_ID,
  },
};

console.log("🔧 Appwrite Configuration Verification");
console.log("=====================================");

console.log("Endpoint:", APPWRITE_CONFIG.endpoint || "❌ Missing");
console.log("Project ID:", APPWRITE_CONFIG.projectId || "❌ Missing");
console.log("Database ID:", APPWRITE_CONFIG.databaseId || "❌ Missing");
console.log(
  "Users Collection:",
  APPWRITE_CONFIG.collections.users || "❌ Missing",
);
console.log(
  "Documents Collection:",
  APPWRITE_CONFIG.collections.documents || "❌ Missing",
);
console.log(
  "Notifications Collection:",
  APPWRITE_CONFIG.collections.notifications || "❌ Missing",
);
console.log(
  "App Config Collection:",
  APPWRITE_CONFIG.collections.appConfig || "❌ Missing",
);

console.log("=====================================");

// Check if all required configs are present
const requiredConfigs = [
  APPWRITE_CONFIG.endpoint,
  APPWRITE_CONFIG.projectId,
  APPWRITE_CONFIG.databaseId,
  APPWRITE_CONFIG.collections.users,
  APPWRITE_CONFIG.collections.documents,
  APPWRITE_CONFIG.collections.notifications,
  APPWRITE_CONFIG.collections.appConfig,
];

const allConfigsPresent = requiredConfigs.every((config) => config);

if (allConfigsPresent) {
  console.log("✅ All configurations are properly set!");
} else {
  console.log(
    "❌ Some configurations are missing. Please check your environment variables.",
  );
  console.log("Required environment variables:");
  console.log("- APPWRITE_ENDPOINT");
  console.log("- APPWRITE_PROJECT_ID");
  console.log("- APPWRITE_DATABASE_ID");
  console.log("- APPWRITE_USERS_COLLECTION_ID");
  console.log("- APPWRITE_DOCUMENTS_COLLECTION_ID");
  console.log("- APPWRITE_NOTIFICATIONS_COLLECTION_ID");
  console.log("- APPWRITE_APP_CONFIG_COLLECTION_ID");
  console.log("- APPWRITE_API_KEY (for server operations)");
}
