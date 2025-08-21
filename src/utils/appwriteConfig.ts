import { Client, Account, Databases, Storage } from "appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const client = new Client()
  .setEndpoint(Constants.expoConfig?.extra?.appwriteEndpoint || "")
  .setProject(Constants.expoConfig?.extra?.appwriteProjectId || "");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const APPWRITE_DATABASE_ID = "68a6dae8000584a61b92";
export const USERS_COLLECTION_ID = "68a6daf10000e14badc1";
export const DOCUMENTS_COLLECTION_ID = "68a6ddcc002d501d175d";
export const NOTIFICATIONS_COLLECTION_ID = "68a6e4af000ea69be8e8";
export const DOCUMENTS_BUCKET_ID = "68a6e5e90008c878e311";

export { client, account, databases, storage };
