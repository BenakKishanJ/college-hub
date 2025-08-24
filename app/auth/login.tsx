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
import { Link, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Invalid credentials");
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
          College Hub
        </Text>

        <View className="bg-white p-6 rounded-lg shadow-sm">
          <Text className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Login
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
            className="border border-gray-300 rounded-lg p-4 mb-6"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCorrect={false}
          />

          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg"
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white font-semibold text-center">
              {isLoading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-gray-600">Don't have an account? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text className="text-blue-500 font-semibold">Register</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
