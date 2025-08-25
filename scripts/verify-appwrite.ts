// scripts/verify-appwrite.ts
import { APPWRITE_CONFIG } from "../lib/appwrite";

console.log("Appwrite Configuration:");
console.log("Endpoint:", APPWRITE_CONFIG.endpoint);
console.log("Project ID:", APPWRITE_CONFIG.projectId);
console.log("Database ID:", APPWRITE_CONFIG.databaseId);

if (APPWRITE_CONFIG.projectId && APPWRITE_CONFIG.databaseId) {
  console.log("✅ Appwrite configuration looks good!");
} else {
  console.log("❌ Appwrite configuration is missing required values");
}
