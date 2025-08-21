import { account } from "./appwriteConfig";
import {
  databases,
  APPWRITE_DATABASE_ID,
  USERS_COLLECTION_ID,
} from "./appwriteConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ID } from "appwrite";

interface UserProfile {
  displayName: string;
  role: string;
  department: string;
  semester?: string;
  phoneNumber?: string;
  profileComplete: boolean;
  email: string;
}

export const login = async (email: string, password: string) => {
  try {
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    return user;
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
};

export const signup = async (
  email: string,
  password: string,
  displayName: string,
) => {
  try {
    const userId = ID.unique();
    await account.create(userId, email, password, displayName);
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        displayName,
        email,
        role: "student",
        department: "",
        semester: "",
        phoneNumber: "",
        profileComplete: false,
      },
      ["role:member"],
    );
    return user;
  } catch (error: any) {
    throw new Error(error.message || "Signup failed");
  }
};

export const logout = async () => {
  try {
    await account.deleteSession("current");
    await AsyncStorage.removeItem("user");
  } catch (error: any) {
    throw new Error(error.message || "Logout failed");
  }
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = await account.get();
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      user.$id,
    );
    return {
      displayName: doc.displayName,
      role: doc.role,
      department: doc.department,
      semester: doc.semester,
      phoneNumber: doc.phoneNumber,
      profileComplete: doc.profileComplete,
      email: doc.email,
    };
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  profileData: UserProfile,
) => {
  try {
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      profileData,
    );
  } catch (error: any) {
    throw new Error(error.message || "Failed to update profile");
  }
};
