import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Enable persistence for auth state
auth.setPersistence ? auth.setPersistence(browserLocalPersistence) : null;

interface UserProfile {
  displayName: string;
  role: "student" | "teacher";
  department: string;
  semester: string;
  phoneNumber?: string;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export const signUp = async (
  email: string,
  password: string,
  profile: Omit<UserProfile, "createdAt" | "updatedAt">,
): Promise<User> => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      ...profile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    return user;
  } catch (error: any) {
    console.error("Sign up error:", error);

    // Provide user-friendly error messages
    switch (error.code) {
      case "auth/email-already-in-use":
        throw new Error("An account with this email already exists");
      case "auth/invalid-email":
        throw new Error("Please enter a valid email address");
      case "auth/weak-password":
        throw new Error("Password should be at least 6 characters long");
      case "auth/network-request-failed":
        throw new Error("Network error. Please check your connection");
      default:
        throw new Error(error.message || "Failed to create account");
    }
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error: any) {
    console.error("Login error:", error);

    // Provide user-friendly error messages
    switch (error.code) {
      case "auth/user-not-found":
        throw new Error("No account found with this email address");
      case "auth/wrong-password":
        throw new Error("Incorrect password");
      case "auth/invalid-email":
        throw new Error("Please enter a valid email address");
      case "auth/user-disabled":
        throw new Error("This account has been disabled");
      case "auth/too-many-requests":
        throw new Error("Too many failed attempts. Please try again later");
      case "auth/network-request-failed":
        throw new Error("Network error. Please check your connection");
      default:
        throw new Error(error.message || "Failed to sign in");
    }
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Logout error:", error);
    throw new Error("Failed to sign out");
  }
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (
  profileData: Partial<Omit<UserProfile, "createdAt" | "updatedAt">>,
): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const updatedData = {
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", currentUser.uid), updatedData, {
      merge: true,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
};
