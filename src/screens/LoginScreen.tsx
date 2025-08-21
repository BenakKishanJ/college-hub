import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { login, signup } from "../utils/authUtils";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    if (isSignUp && !displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password, displayName);
        navigation.navigate("ProfileSetup", { email, password });
      } else {
        await login(email, password);
        navigation.navigate("Main");
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? "Signup failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-6">
        <View className="mx-auto w-full max-w-sm">
          <View className="mb-8 text-center">
            <View className="w-16 h-16 bg-black rounded-2xl mx-auto mb-6 items-center justify-center">
              <Text className="text-white text-2xl font-bold">CH</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? "Create account" : "Welcome back"}
            </Text>
            <Text className="text-gray-600 text-sm">
              {isSignUp
                ? "Enter your details to create your account"
                : "Enter your credentials to access your account"}
            </Text>
          </View>

          <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            {isSignUp && (
              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-900">
                  Full Name
                </Text>
                <TextInput
                  className="w-full h-11 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  placeholder="Enter your full name"
                  value={displayName}
                  onChangeText={(text) => {
                    setDisplayName(text);
                    setError("");
                  }}
                  editable={!loading}
                />
              </View>
            )}

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-900">Email</Text>
              <TextInput
                className="w-full h-11 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                placeholder="name@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-900">
                Password
              </Text>
              <TextInput
                className="w-full h-11 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError("");
                }}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {error && (
              <View className="p-3 bg-red-50 border border-red-200 rounded-md">
                <Text className="text-red-600 text-sm text-center">
                  {error}
                </Text>
              </View>
            )}

            <TouchableOpacity
              className={`w-full h-11 rounded-md items-center justify-center ${loading ? "bg-gray-400" : "bg-gray-900 active:bg-gray-800"}`}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text className="text-white font-medium text-sm">
                {loading
                  ? "Processing..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6">
            <View className="flex-row justify-center items-center">
              <Text className="text-sm text-gray-600">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </Text>
              <TouchableOpacity
                className="ml-1"
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                disabled={loading}
              >
                <Text className="text-sm font-medium text-gray-900 underline">
                  {isSignUp ? "Sign in" : "Sign up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
