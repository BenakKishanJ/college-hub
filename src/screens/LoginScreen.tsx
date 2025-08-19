import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import { login, signUp } from "../utils/authUtils";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login/signup

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        await signUp(email, password);
        alert("Sign Up Successful!");
      } else {
        await login(email, password);
        // Navigation happens in App.tsx
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 justify-center items-center p-6">
      <View className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isSignUp ? "Sign Up" : "Login"} to College Hub
        </Text>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Email</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Password</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Error Message */}
        {error ? (
          <Text className="text-red-500 text-sm mb-4 text-center">{error}</Text>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-md py-3 mb-4"
          onPress={handleAuth}
          activeOpacity={0.7}
        >
          <Text className="text-white text-center font-semibold">
            {isSignUp ? "Sign Up" : "Login"}
          </Text>
        </TouchableOpacity>

        {/* Toggle Login/SignUp */}
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text className="text-blue-600 text-center">
            {isSignUp
              ? "Already have an account? Login"
              : "Need an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
