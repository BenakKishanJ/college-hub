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
