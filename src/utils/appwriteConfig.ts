import { Client, Account, Databases, Storage } from "appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const client = new Client()
  .setEndpoint(Constants.expoConfig?.extra?.appwriteEndpoint || "")
  .setProject(Constants.expoConfig?.extra?.appwriteProjectId || "");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const APPWRITE_DATABASE_ID = "college_hub_db";
export const USERS_COLLECTION_ID = "users";
export const DOCUMENTS_COLLECTION_ID = "documents";
export const NOTIFICATIONS_COLLECTION_ID = "notifications";
export const DOCUMENTS_BUCKET_ID = "documents";

export { client, account, databases, storage };
