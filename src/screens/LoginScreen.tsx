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
        navigation.navigate("Home");
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? "Signup failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-8">
        <Text className="text-4xl font-black text-black mb-2 tracking-tight">
          {isSignUp ? "Sign Up" : "Sign In"}
        </Text>
        <Text className="text-gray-500 text-base leading-6 mb-8">
          {isSignUp
            ? "Create an account to get started"
            : "Welcome back to College Hub"}
        </Text>
        <View className="space-y-6">
          {isSignUp && (
            <View className="space-y-2">
              <Text className="text-sm font-medium text-black">Name *</Text>
              <TextInput
                className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
                placeholder="Enter your name"
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
            <Text className="text-sm font-medium text-black">Email *</Text>
            <TextInput
              className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
              placeholder="Enter your email"
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
            <Text className="text-sm font-medium text-black">Password *</Text>
            <TextInput
              className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
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
            <View className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          )}
          <TouchableOpacity
            className={`w-full h-12 rounded-lg items-center justify-center ${loading ? "bg-gray-400" : "bg-black active:bg-gray-800"}`}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          </TouchableOpacity>
          <View className="flex-row justify-center">
            <Text className="text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              disabled={loading}
            >
              <Text className="text-black font-semibold ml-1">
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
