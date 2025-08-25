import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { verifyTeacherSecretCode } from "../../../lib/appwrite";

export default function TeacherLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const { login } = useAuth();

  const validateInputs = () => {
    if (!email.trim() || !password || !secretCode.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const handleTeacherLogin = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setIsVerifyingCode(true);

    try {
      // Verify the secret code on the server side first
      const isValidCode = await verifyTeacherSecretCode(secretCode.trim());
      setIsVerifyingCode(false);

      if (!isValidCode) {
        Alert.alert(
          "Error",
          "Invalid teacher code. Please contact administrator.",
        );
        setIsLoading(false);
        return;
      }

      // Login the user and verify they have teacher role
      const user = await login(email.toLowerCase().trim(), password, "teacher");

      // Additional verification that the user has teacher role
      if (user.role !== "teacher") {
        Alert.alert(
          "Error",
          "This account is not registered as a teacher account.",
        );
        setIsLoading(false);
        return;
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Teacher login error:", error);

      let errorMessage = "Login failed. Please try again.";

      if (error.code === 401 || error.message.includes("Invalid credentials")) {
        errorMessage = "Invalid email or password";
      } else if (error.code === 429) {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error.message.includes("configuration")) {
        errorMessage =
          "Teacher authentication is not configured. Please contact administrator.";
      } else if (
        error.message.includes("network") ||
        error.code === "NetworkError"
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message.includes("User not found")) {
        errorMessage = "No account found with this email address";
      } else if (error.message.includes("role")) {
        errorMessage = "This account is not registered as a teacher account";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
      setIsVerifyingCode(false);
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
            onChangeText={(text) => setEmail(text.toLowerCase())}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            editable={!isLoading}
            maxLength={100}
          />

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCorrect={false}
            editable={!isLoading}
            maxLength={128}
          />

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-6"
            placeholder="Teacher Secret Code"
            value={secretCode}
            onChangeText={setSecretCode}
            secureTextEntry
            autoCorrect={false}
            editable={!isLoading}
            maxLength={50}
          />

          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg items-center justify-center"
            onPress={handleTeacherLogin}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                {isVerifyingCode ? (
                  <Text className="text-white font-semibold">
                    Verifying code...
                  </Text>
                ) : (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-semibold ml-2">
                      Logging in...
                    </Text>
                  </>
                )}
              </View>
            ) : (
              <Text className="text-white font-semibold">Login as Teacher</Text>
            )}
          </TouchableOpacity>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-gray-600">Student? </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              disabled={isLoading}
            >
              <Text className="text-blue-500 font-semibold">Student Login</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-2 flex-row justify-center">
            <Text className="text-gray-600">New teacher? </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/teacher/register")}
              disabled={isLoading}
            >
              <Text className="text-blue-500 font-semibold">Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
