// app/auth/register.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.email, formData.password, {
        displayName: formData.displayName,
        role: "student",
      });
      // AuthGuard will automatically redirect to tabs
    } catch (error: any) {
      Alert.alert("Error", error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
      <ScrollView className="flex-1 bg-gray-50 p-4">
        <Text className="text-3xl font-bold text-center text-gray-900 mb-8">
          Create Account
        </Text>

        <View className="bg-white p-6 rounded-lg shadow-sm">
          <Text className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Student Registration
          </Text>

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Full Name"
            value={formData.displayName}
            onChangeText={(text) =>
              setFormData({ ...formData, displayName: text })
            }
          />

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
            secureTextEntry
          />

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-6"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) =>
              setFormData({ ...formData, confirmPassword: text })
            }
            secureTextEntry
          />

          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg"
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-white font-semibold text-center">
              {isLoading ? "Creating Account..." : "Register"}
            </Text>
          </TouchableOpacity>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text className="text-blue-500 font-semibold">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
