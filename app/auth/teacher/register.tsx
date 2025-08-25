import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { verifyTeacherSecretCode } from "../../../lib/appwrite";

export default function TeacherRegisterScreen() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    secretCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const { register } = useAuth();

  const validateInputs = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.displayName ||
      !formData.secretCode
    ) {
      Alert.alert("Error", "Please fill all fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    if (formData.displayName.trim().length < 2) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }

    if (formData.secretCode.trim().length === 0) {
      Alert.alert("Error", "Please enter the teacher secret code");
      return false;
    }

    return true;
  };

  const handleTeacherRegister = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setIsVerifyingCode(true);

    try {
      // Verify the secret code on the server side
      const isValidCode = await verifyTeacherSecretCode(
        formData.secretCode.trim(),
      );
      setIsVerifyingCode(false);

      if (!isValidCode) {
        Alert.alert(
          "Error",
          "Invalid teacher code. Please contact administrator.",
        );
        setIsLoading(false);
        return;
      }

      // Register as teacher
      await register(formData.email.toLowerCase().trim(), formData.password, {
        displayName: formData.displayName.trim(),
        role: "teacher",
        profileComplete: true,
        department: "", // Can be added later
      });

      Alert.alert("Success", "Teacher account created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error: any) {
      console.error("Teacher registration error:", error);

      let errorMessage = "Registration failed. Please try again.";

      if (error.code === 409 || error.message.includes("already exists")) {
        errorMessage = "An account with this email already exists";
      } else if (error.code === 400) {
        errorMessage = "Invalid registration data. Please check your inputs.";
      } else if (error.message.includes("configuration")) {
        errorMessage =
          "Teacher authentication is not configured. Please contact administrator.";
      } else if (
        error.message.includes("network") ||
        error.code === "NetworkError"
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setIsLoading(false);
      setIsVerifyingCode(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView className="flex-1 bg-gray-50 p-4">
          <Text className="text-3xl font-bold text-center text-gray-900 mb-8">
            Teacher Registration
          </Text>

          <View className="bg-white p-6 rounded-lg shadow-sm">
            <Text className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Create Teacher Account
            </Text>

            <TextInput
              className="border border-gray-300 rounded-lg p-4 mb-4"
              placeholder="Full Name"
              value={formData.displayName}
              onChangeText={(text) =>
                setFormData({ ...formData, displayName: text })
              }
              editable={!isLoading}
              autoCorrect={false}
              maxLength={50}
            />

            <TextInput
              className="border border-gray-300 rounded-lg p-4 mb-4"
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) =>
                setFormData({ ...formData, email: text.toLowerCase() })
              }
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
              autoCorrect={false}
              maxLength={100}
            />

            <TextInput
              className="border border-gray-300 rounded-lg p-4 mb-4"
              placeholder="Password (min. 8 characters)"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry
              editable={!isLoading}
              autoCorrect={false}
              maxLength={128}
            />

            <TextInput
              className="border border-gray-300 rounded-lg p-4 mb-4"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              secureTextEntry
              editable={!isLoading}
              autoCorrect={false}
              maxLength={128}
            />

            <TextInput
              className="border border-gray-300 rounded-lg p-4 mb-6"
              placeholder="Teacher Secret Code"
              value={formData.secretCode}
              onChangeText={(text) =>
                setFormData({ ...formData, secretCode: text })
              }
              secureTextEntry
              editable={!isLoading}
              autoCorrect={false}
              maxLength={50}
            />

            <TouchableOpacity
              className="bg-blue-500 p-4 rounded-lg items-center justify-center"
              onPress={handleTeacherRegister}
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
                        Creating account...
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                <Text className="text-white font-semibold">
                  Register as Teacher
                </Text>
              )}
            </TouchableOpacity>

            <View className="mt-4 flex-row justify-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/teacher/login")}
                disabled={isLoading}
              >
                <Text className="text-blue-500 font-semibold">
                  Teacher Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
