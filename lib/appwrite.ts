// lib/appwrite.ts
import { Client, Account, Databases, Storage, Query } from "appwrite";
import Constants from "expo-constants";

// Get environment variables from Expo config
const {
  appwriteEndpoint,
  appwriteProjectId,
  appwriteDatabaseId,
  appwriteUsersCollectionId,
  appwriteDocumentsCollectionId,
  appwriteNotificationsCollectionId,
  appwriteAppConfigCollectionId,
  appwriteBucketId, // configure storage bucket
} = Constants.expoConfig?.extra || {};

// Validate environment variables
if (!appwriteEndpoint || !appwriteProjectId || !appwriteDatabaseId) {
  console.error(
    "Appwrite configuration is missing. Check your environment variables.",
  );
  console.log("Endpoint:", appwriteEndpoint);
  console.log("Project ID:", appwriteProjectId);
  console.log("Database ID:", appwriteDatabaseId);
}

// Initialize Appwrite client
const client = new Client();

if (appwriteEndpoint && appwriteProjectId) {
  client.setEndpoint(appwriteEndpoint).setProject(appwriteProjectId);
} else {
  console.warn(
    "Appwrite client not configured due to missing environment variables",
  );
}

// Export Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export all configuration
export const APPWRITE_CONFIG = {
  endpoint: appwriteEndpoint,
  projectId: appwriteProjectId,
  databaseId: appwriteDatabaseId,
  bucketId: appwriteBucketId || "documents",
  collections: {
    users: appwriteUsersCollectionId || "users",
    documents: appwriteDocumentsCollectionId || "documents",
    notifications: appwriteNotificationsCollectionId || "notifications",
    appConfig: appwriteAppConfigCollectionId || "app_config",
  },
};

export default client;

// Helper functions for teacher secret code

/**
 * Get the teacher secret hash from the database
 */
export const getTeacherSecretHash = async (): Promise<string> => {
  try {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.appConfig) {
      throw new Error("Database or collection ID not configured");
    }

    // Fetch all documents from app_config collection
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.appConfig,
      [
        Query.equal("config_name", "teacher_auth"),
        Query.orderDesc("code_last_updated"), // Sort by latest update
        Query.limit(1), // Get only the most recent one
      ],
    );

    if (response.documents.length === 0) {
      throw new Error("No teacher authentication configuration found");
    }

    const latestConfig = response.documents[0];
    return latestConfig.teacher_secret_code_hash;
  } catch (error) {
    console.error("Error fetching teacher secret hash:", error);
    throw new Error("Failed to retrieve teacher authentication configuration");
  }
};

/**
 * Verify teacher secret code (Client-side approach for Expo)
 * This fetches the hash and compares it on the client side
 */
export const verifyTeacherSecretCode = async (
  secretCode: string,
): Promise<boolean> => {
  try {
    if (!secretCode || secretCode.trim().length === 0) {
      throw new Error("Secret code is required");
    }

    const storedHash = await getTeacherSecretHash();

    // Dynamic import to avoid bundling issues in Expo
    const bcrypt = await import("bcryptjs");
    return await bcrypt.compare(secretCode.trim(), storedHash);
  } catch (error) {
    console.error("Error verifying teacher secret code:", error);
    throw new Error(
      "Failed to verify teacher code. Please contact administrator.",
    );
  }
};

/**
 * Client-side verification - Simple approach for Expo projects
 * This is used for teacher code verification in Expo apps
 */
export const verifyTeacherSecretCodeClientSide = async (
  secretCode: string,
): Promise<boolean> => {
  try {
    const storedHash = await getTeacherSecretHash();

    // Dynamic import to avoid bundling issues
    const bcrypt = await import("bcryptjs");
    return await bcrypt.compare(secretCode.trim(), storedHash);
  } catch (error) {
    console.error("Error in client-side verification:", error);
    throw new Error(
      "Failed to verify teacher code. Please contact administrator.",
    );
  }
};

/**
 * Update the teacher secret hash in the database
 */
export const updateTeacherSecretHash = async (
  newHash: string,
): Promise<void> => {
  try {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.appConfig) {
      throw new Error("Database or collection ID not configured");
    }

    // First, get the latest config to update it
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.appConfig,
      [
        Query.equal("config_name", "teacher_auth"),
        Query.orderDesc("code_last_updated"),
        Query.limit(1),
      ],
    );

    if (response.documents.length === 0) {
      // No existing config, create a new one
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.appConfig,
        "unique()", // Let Appwrite generate a unique ID
        {
          teacher_secret_code_hash: newHash,
          code_last_updated: new Date().toISOString(),
          config_name: "teacher_auth",
          description: "Teacher authentication configuration",
        },
      );
    } else {
      // Update the existing latest config
      const latestConfig = response.documents[0];
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.appConfig,
        latestConfig.$id,
        {
          teacher_secret_code_hash: newHash,
          code_last_updated: new Date().toISOString(),
        },
      );
    }
  } catch (error) {
    console.error("Error updating teacher secret hash:", error);
    throw new Error("Failed to update teacher authentication configuration");
  }
};

/**
 * Create or update teacher secret code (for admin use)
 */
export const setTeacherSecretCode = async (
  newSecretCode: string,
): Promise<void> => {
  try {
    if (!newSecretCode || newSecretCode.trim().length === 0) {
      throw new Error("Secret code cannot be empty");
    }

    // Hash the new secret code
    const bcrypt = await import("bcryptjs");
    const hashedCode = await bcrypt.hash(newSecretCode.trim(), 10);

    await updateTeacherSecretHash(hashedCode);
  } catch (error) {
    console.error("Error setting teacher secret code:", error);
    throw new Error("Failed to set teacher secret code");
  }
};

/**
 * Check if teacher authentication is configured
 */
export const isTeacherAuthConfigured = async (): Promise<boolean> => {
  try {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.appConfig) {
      return false;
    }

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.appConfig,
      [Query.equal("config_name", "teacher_auth"), Query.limit(1)],
    );

    return response.documents.length > 0;
  } catch (error) {
    console.error("Error checking teacher auth configuration:", error);
    return false;
  }
};

/**
 * Get all teacher configurations (for admin purposes)
 */
export const getAllTeacherConfigs = async (): Promise<any[]> => {
  try {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.appConfig) {
      throw new Error("Database or collection ID not configured");
    }

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.appConfig,
      [
        Query.equal("config_name", "teacher_auth"),
        Query.orderDesc("code_last_updated"),
      ],
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching teacher configs:", error);
    throw new Error("Failed to retrieve teacher configurations");
  }
};

/**
 * Get teacher configuration info (without the hash)
 */
export const getTeacherConfigInfo = async (): Promise<{
  lastUpdated: string;
  isConfigured: boolean;
  description?: string;
}> => {
  try {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.appConfig) {
      return { lastUpdated: "", isConfigured: false };
    }

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.appConfig,
      [
        Query.equal("config_name", "teacher_auth"),
        Query.orderDesc("code_last_updated"),
        Query.limit(1),
      ],
    );

    if (response.documents.length === 0) {
      return { lastUpdated: "", isConfigured: false };
    }

    const config = response.documents[0];
    return {
      lastUpdated: config.code_last_updated || "",
      isConfigured: true,
      description: config.description || "Teacher authentication configuration",
    };
  } catch (error) {
    console.error("Error fetching teacher config info:", error);
    return { lastUpdated: "", isConfigured: false };
  }
};
