import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { login } from "../utils/authUtils";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const validateForm = () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return false;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Navigate to profile setup for new users
        navigation.navigate("ProfileSetup", {
          email: email.trim().toLowerCase(),
          password,
          isExistingUser: false,
        });
      } else {
        // Login existing user
        await login(email.trim().toLowerCase(), password);
        // Navigation will be handled by auth state change in App.tsx
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setEmail("");
    setPassword("");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="mb-12">
            <Text className="text-3xl font-black text-black mb-2 tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Text>
            <Text className="text-gray-500 text-base leading-6">
              {isSignUp
                ? "Enter your details to create your account"
                : "Enter your credentials to access your account"}
            </Text>
          </View>

          {/* Form Container */}
          <View className="space-y-6">
            {/* Email Field */}
            <View className="space-y-2">
              <Text className="text-sm font-medium text-black">Email</Text>
              <TextInput
                className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
                placeholder="name@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            {/* Password Field */}
            <View className="space-y-2">
              <Text className="text-sm font-medium text-black">Password</Text>
              <TextInput
                className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError("");
                }}
                secureTextEntry
                autoComplete={isSignUp ? "new-password" : "current-password"}
                editable={!loading}
              />
            </View>

            {/* Error Message */}
            {error ? (
              <View className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-600 text-sm text-center">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Auth Button */}
            <TouchableOpacity
              className={`w-full h-12 rounded-lg items-center justify-center ${
                loading ? "bg-gray-400" : "bg-black active:bg-gray-800"
              }`}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text className="text-white font-semibold text-base">
                {loading
                  ? "Please wait..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-8 pt-6 border-t border-gray-100">
            <TouchableOpacity
              onPress={toggleMode}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text className="text-center text-gray-600">
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <Text className="font-semibold text-black underline">
                  {isSignUp ? "Sign in" : "Sign up"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
