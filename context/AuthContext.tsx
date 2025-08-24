import React, { createContext, useContext, useEffect, useState } from "react";
import { account } from "../lib/appwrite";
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
  login: (email: string, password: string) => Promise<void>;
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
  login: async () => { },
  register: async () => { },
  logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

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
      // For now, we'll set a mock user until we implement database queries
      setUser({
        $id: currentUser.$id,
        $createdAt: currentUser.$createdAt,
        $updatedAt: currentUser.$updatedAt,
        displayName: currentUser.name || "Student",
        department: "Computer Science",
        semester: "3rd",
        phoneNumber: "",
        profileComplete: true,
        email: currentUser.email,
        role: "student",
      } as User);
      setIsLoading(false);
    } catch (error) {
      console.log("No user logged in");
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await account.createSession(email, password);
      await checkUser();
    } catch (error) {
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
      await login(email, password);

      // TODO: Save additional user data to database
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
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
