import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { logout } from "../utils/authUtils";

export default function HomeScreen() {
  const handleLogout = async () => {
    try {
      await logout();
      alert("Logged out successfully!");
    } catch (err: any) {
      alert("Logout failed: " + err.message);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 justify-center items-center p-6">
      <View className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Welcome to College Hub!
        </Text>
        <Text className="text-gray-600 mb-4 text-center">
          You are logged in. This is the homepage.
        </Text>
        <TouchableOpacity
          className="bg-red-600 rounded-md py-3"
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text className="text-white text-center font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
