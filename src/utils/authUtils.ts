import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

// Sign Up
export const signUp = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Login
export const login = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Logout
export const logout = async (): Promise<void> => {
  return signOut(auth);
};

// Get Current User
export const getCurrentUser = () => auth.currentUser;
