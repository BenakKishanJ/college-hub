// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { account, databases, APPWRITE_CONFIG } from "../lib/appwrite";
import { Models } from "appwrite";

interface User extends Models.Document {
  displayName: string;
  department: string;
  semester: string;
  phoneNumber: string;
  profileComplete: boolean;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    expectedRole?: string,
  ) => Promise<User>;
  register: (
    email: string,
    password: string,
    userData: Partial<User>,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({}) as User,
  register: async () => { },
  logout: async () => { },
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();

      try {
        // Try to get user data from database
        const userDoc = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.users,
          currentUser.$id,
        );

        setUser(userDoc as unknown as User);
      } catch (error) {
        // User doesn't exist in database, create a minimal user object
        setUser({
          $id: currentUser.$id,
          $createdAt: currentUser.$createdAt,
          $updatedAt: currentUser.$updatedAt,
          displayName: currentUser.name || "Student",
          department: "Computer Science",
          semester: "3rd",
          phoneNumber: "",
          profileComplete: false,
          email: currentUser.email,
          role: "student",
        } as User);
      }
    } catch (error) {
      console.log("No user logged in");
      // No user is logged in, which is fine
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    expectedRole: string = "student",
  ): Promise<User> => {
    try {
      await account.createEmailPasswordSession(email, password);

      // Get the current user
      const currentUser = await account.get();

      // Get user data from database
      try {
        const userDoc = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.users,
          currentUser.$id,
        );

        const userData = userDoc as unknown as User;

        // Verify role if expectedRole is specified
        if (expectedRole && userData.role !== expectedRole) {
          // Logout the user since they don't have the expected role
          await account.deleteSession("current");
          throw new Error(
            `This account is not registered as a ${expectedRole}`,
          );
        }

        setUser(userData);
        return userData;
      } catch (dbError) {
        // User not found in database, logout and throw error
        await account.deleteSession("current");
        throw new Error("User profile not found. Please register first.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    userData: Partial<User>,
  ) => {
    try {
      // Create account
      await account.create(
        "unique()",
        email,
        password,
        userData.displayName || email,
      );

      // Login immediately after registration
      await account.createEmailPasswordSession(email, password);

      // Save additional user data to database
      const currentUser = await account.get();
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        currentUser.$id,
        {
          displayName: userData.displayName || email.split("@")[0],
          email: currentUser.email,
          role: userData.role || "student",
          profileComplete: userData.profileComplete || false,
          department: userData.department || "",
          semester: userData.semester || "",
          phoneNumber: userData.phoneNumber || "",
        },
      );

      await checkUser(); // Refresh user data
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Failed to logout");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
