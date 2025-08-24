// app/auth/teacher-login.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import bcrypt from "bcryptjs";
import { getTeacherSecretHash } from "../../../lib/appwrite";

export default function TeacherLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleTeacherLogin = async () => {
    if (!email || !password || !secretCode) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsLoading(true);
    try {
      // Verify the secret code
      const storedHash = await getTeacherSecretHash();
      const isValidCode = await bcrypt.compare(secretCode, storedHash);

      if (!isValidCode) {
        Alert.alert("Error", "Invalid teacher code");
        return;
      }

      // Login the user
      await login(email, password, "teacher");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Teacher login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 16,
          backgroundColor: "#f3f4f6",
        }}
      >
        <Text className="text-3xl font-bold text-center text-gray-900 mb-8">
          Teacher Login
        </Text>

        <View className="bg-white p-6 rounded-lg shadow-sm">
          <Text className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            College Hub - Teachers
          </Text>

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCorrect={false}
          />

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-6"
            placeholder="Teacher Secret Code"
            value={secretCode}
            onChangeText={setSecretCode}
            secureTextEntry
            autoCorrect={false}
          />

          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg"
            onPress={handleTeacherLogin}
            disabled={isLoading}
          >
            <Text className="text-white font-semibold text-center">
              {isLoading ? "Logging in..." : "Login as Teacher"}
            </Text>
          </TouchableOpacity>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-gray-600">Student? </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/login")}>
              <Text className="text-blue-500 font-semibold">Student Login</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-2 flex-row justify-center">
            <Text className="text-gray-600">New teacher? </Text>
            <TouchableOpacity
              onPress={() => router.replace("/auth/teacher/register")}
            >
              <Text className="text-blue-500 font-semibold">Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
