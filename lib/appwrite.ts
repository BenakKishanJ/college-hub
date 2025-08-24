// lib/appwrite.ts
import { Client, Account, Databases, Storage } from "appwrite";
import Constants from "expo-constants";

const { appwriteEndpoint, appwriteProjectId } =
  Constants.expoConfig?.extra || {};

const client = new Client();

if (!appwriteEndpoint || !appwriteProjectId) {
  console.error(
    "Appwrite configuration is missing. Check your environment variables.",
  );
} else {
  client.setEndpoint(appwriteEndpoint).setProject(appwriteProjectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export default client;

// helper functions for teacher secret code
export const getTeacherSecretHash = async (): Promise<string> => {
  try {
    const document = await databases.getDocument(
      "college_hub_db",
      "app_config",
      "teacher_auth",
    );
    return document.teacher_secret_code_hash;
  } catch (error) {
    console.error("Error fetching teacher secret hash:", error);
    throw new Error("Failed to retrieve teacher authentication configuration");
  }
};

export const updateTeacherSecretHash = async (
  newHash: string,
): Promise<void> => {
  try {
    await databases.updateDocument(
      "college_hub_db",
      "app_config",
      "teacher_auth",
      {
        teacher_secret_code_hash: newHash,
        code_last_updated: new Date().toISOString(),
      },
    );
  } catch (error) {
    console.error("Error updating teacher secret hash:", error);
    throw new Error("Failed to update teacher authentication configuration");
  }
};
