// auth/teacher/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  UserPlus,
  GraduationCap,
} from "lucide-react-native";
import { Card } from "../../../components/ui/card";
import { Button, ButtonText } from "../../../components/ui/button";
import { verifyTeacherSecretCode } from "../../../lib/appwrite";

export default function TeacherRegisterScreen() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    secretCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const { register } = useAuth();

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

      await register(formData.email.toLowerCase().trim(), formData.password, {
        displayName: formData.displayName.trim(),
        role: "teacher",
        profileComplete: true,
        department: "",
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
    <SafeAreaView className="flex-1 bg-neutral-200">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between px-6 py-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white p-2 rounded-lg border border-neutral-200"
              disabled={isLoading}
            >
              <ArrowLeft size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-groteskBold text-black">
              Teacher Registration
            </Text>
            <View className="w-10" />
          </View>

          <View className="flex-1 px-6 pb-6">
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
              className="items-center mb-8"
            >
              <View className="bg-lime-400 rounded-full p-6 mb-6">
                <GraduationCap size={48} color="black" />
              </View>

              <Text className="text-3xl font-groteskBold text-black text-center mb-2">
                Teacher Registration
              </Text>
              <Text className="text-neutral-400 font-grotesk text-center text-lg">
                Create your teacher account
              </Text>
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Card className="bg-white border border-neutral-200 p-6 mb-6">
                <View className="mb-4">
                  <Text className="text-black font-groteskBold mb-2">
                    Full Name
                  </Text>
                  <View className="flex-row items-center bg-neutral-200 rounded-lg px-4 py-3 border border-neutral-200">
                    <User size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter your full name"
                      placeholderTextColor="#a3a3a3"
                      value={formData.displayName}
                      onChangeText={(text) =>
                        setFormData({ ...formData, displayName: text })
                      }
                      editable={!isLoading}
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-black font-groteskBold mb-2">
                    Email
                  </Text>
                  <View className="flex-row items-center bg-neutral-200 rounded-lg px-4 py-3 border border-neutral-200">
                    <Mail size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter your email"
                      placeholderTextColor="#a3a3a3"
                      value={formData.email}
                      onChangeText={(text) =>
                        setFormData({ ...formData, email: text.toLowerCase() })
                      }
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-black font-groteskBold mb-2">
                    Password
                  </Text>
                  <View className="flex-row items-center bg-neutral-200 rounded-lg px-4 py-3 border border-neutral-200">
                    <Lock size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Create a password (min. 8 characters)"
                      placeholderTextColor="#a3a3a3"
                      value={formData.password}
                      onChangeText={(text) =>
                        setFormData({ ...formData, password: text })
                      }
                      secureTextEntry={!showPassword}
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-2"
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#a3a3a3" />
                      ) : (
                        <Eye size={20} color="#a3a3a3" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-black font-groteskBold mb-2">
                    Confirm Password
                  </Text>
                  <View className="flex-row items-center bg-neutral-200 rounded-lg px-4 py-3 border border-neutral-200">
                    <Lock size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Confirm your password"
                      placeholderTextColor="#a3a3a3"
                      value={formData.confirmPassword}
                      onChangeText={(text) =>
                        setFormData({ ...formData, confirmPassword: text })
                      }
                      secureTextEntry={!showConfirmPassword}
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="ml-2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#a3a3a3" />
                      ) : (
                        <Eye size={20} color="#a3a3a3" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-black font-groteskBold mb-2">
                    Teacher Secret Code
                  </Text>
                  <View className="flex-row items-center bg-neutral-200 rounded-lg px-4 py-3 border border-neutral-200">
                    <Lock size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter teacher secret code"
                      placeholderTextColor="#a3a3a3"
                      value={formData.secretCode}
                      onChangeText={(text) =>
                        setFormData({ ...formData, secretCode: text })
                      }
                      secureTextEntry={!showSecretCode}
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowSecretCode(!showSecretCode)}
                      className="ml-2"
                    >
                      {showSecretCode ? (
                        <EyeOff size={20} color="#a3a3a3" />
                      ) : (
                        <Eye size={20} color="#a3a3a3" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <Button
                  variant="solid"
                  size="md"
                  action="primary"
                  onPress={handleTeacherRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <UserPlus size={20} color="white" />
                  )}
                  <ButtonText>
                    {isLoading
                      ? isVerifyingCode
                        ? "Verifying Code..."
                        : "Creating Account..."
                      : "Register as Teacher"}
                  </ButtonText>
                </Button>
              </Card>

              <View className="flex-row justify-center items-center">
                <Text className="text-neutral-400 font-grotesk">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/auth/teacher/login")}
                  disabled={isLoading}
                >
                  <Text className="text-black font-groteskBold">
                    Teacher Login
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
