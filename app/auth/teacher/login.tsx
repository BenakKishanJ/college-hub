import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  ArrowRight,
} from "lucide-react-native";
import { Card } from "../../../components/ui/card";
import { Button, ButtonText } from "../../../components/ui/button";
import { verifyTeacherSecretCode } from "../../../lib/appwrite";
import { Image } from "react-native";

export default function TeacherLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuth();
  const logoImage = require('@/assets/logo.png');

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

      const user = await login(email.toLowerCase().trim(), password, "teacher");

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
          <View className="flex-1 justify-center px-6 py-8">
            <View className="items-center mb-12">
              <View className="bg-white rounded-full p-4 mb-6 overflow-hidden">
                <Image source={logoImage} style={{ width: 120, height: 120 }} />
              </View>

              <Text className="text-4xl font-groteskBold text-black text-center mb-2">
                College Hub
              </Text>
              <Text className="text-neutral-400 font-grotesk text-center text-lg">
                Teacher Portal
              </Text>
            </View>

            <View>
              <Card className="bg-white border border-neutral-200 p-6 mb-6">
                <View className="mb-6">
                  <Text className="text-2xl font-groteskBold text-black text-center mb-2">
                    Teacher Login
                  </Text>
                  <Text className="text-neutral-400 font-grotesk text-center">
                    Access your teaching resources
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black font-groteskBold mb-2">
                    Email
                  </Text>
                  <View
                    className="flex-row items-center bg-neutral-50 rounded-lg px-4 py-3 border-2"
                    style={{ borderColor: focusedField === 'email' ? '#a3e635' : '#d4d4d8' }}>
                    <Mail size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter your email"
                      placeholderTextColor="#a3a3a3"
                      value={email}
                      onChangeText={(text) => setEmail(text.toLowerCase())}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
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
                  <View
                    className="flex-row items-center bg-neutral-50 rounded-lg px-4 py-3 border-2"
                    style={{ borderColor: focusedField === 'password' ? '#a3e635' : '#d4d4d8' }}>
                    <Lock size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter your password"
                      placeholderTextColor="#a3a3a3"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
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

                <View className="mb-6">
                  <Text className="text-black font-groteskBold mb-2">
                    Teacher Secret Code
                  </Text>
                  <View
                    className="flex-row items-center bg-neutral-50 rounded-lg px-4 py-3 border-2"
                    style={{ borderColor: focusedField === 'secretCode' ? '#a3e635' : '#d4d4d8' }}>
                    <Lock size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter teacher secret code"
                      placeholderTextColor="#a3a3a3"
                      value={secretCode}
                      onChangeText={setSecretCode}
                      onFocus={() => setFocusedField('secretCode')}
                      onBlur={() => setFocusedField(null)}
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
                  onPress={handleTeacherLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <ArrowRight size={20} color="white" />
                  )}
                  <ButtonText>
                    {isLoading
                      ? isVerifyingCode
                        ? "Verifying Code..."
                        : "Signing In..."
                      : "Teacher Login"}
                  </ButtonText>
                </Button>
              </Card>

              <View className="space-y-4">
                <TouchableOpacity
                  onPress={() => router.push("/auth/login")}
                  disabled={isLoading}
                  className="bg-white border border-neutral-200 rounded-lg p-4"
                >
                  <View className="flex-row items-center justify-center">
                    <Users size={20} color="#a3a3a3" />
                    <Text className="text-neutral-400 font-grotesk ml-2 mr-1">
                      Student?
                    </Text>
                    <Text className="text-black font-groteskBold">
                      Student Login
                    </Text>
                  </View>
                </TouchableOpacity>

                <View className="flex-row justify-center items-center">
                  <Text className="text-neutral-400 font-grotesk">
                    New teacher?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/auth/teacher/register")}
                    disabled={isLoading}
                  >
                    <Text className="text-black font-groteskBold">
                      Register Here
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
