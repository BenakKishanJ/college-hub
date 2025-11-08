// auth/teacher/login.tsx
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
  Dimensions,
  ImageBackground,
  Animated,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Users,
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { verifyTeacherSecretCode } from "../../../lib/appwrite";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function TeacherLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [secretCodeFocused, setSecretCodeFocused] = useState(false);

  // Animations
  const [buttonScale] = useState(new Animated.Value(1));

  const { login } = useAuth();
  const backgroundImage = require('@/assets/images/drait.png');
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

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>

          {/* Background Image Section */}
          <View className="h-64">
            <ImageBackground
              source={backgroundImage}
              className="w-full h-full"
              resizeMode="cover">
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.2)']}
                className="w-full h-full" />
            </ImageBackground>
          </View>

          {/* Login Card - Full Width, Covers Rest of Screen */}
          <View
            className="flex-1 bg-white px-6 pt-6 pb-6"
            style={{
              minHeight: SCREEN_HEIGHT - 256,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              marginTop: -24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 10,
            }}>

            {/* Logo and Header Section */}
            <View className="items-center mb-8">
              {/* Logo */}
              <View
                className="bg-white rounded-full p-2 mb-4 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <Image
                  source={logoImage}
                  style={{ width: 60, height: 60 }}
                  resizeMode="contain"
                />
              </View>

              {/* Title and Subtitle */}
              <Text className="text-3xl font-groteskBold text-black text-center mb-1">
                THE AITian
              </Text>
              <Text className="text-neutral-500 font-grotesk text-center text-sm">
                Teacher Portal
              </Text>
            </View>

            {/* Login Header */}
            <View className="mb-6">
              <Text className="text-2xl font-groteskBold text-black mb-1">
                Teacher Login
              </Text>
              <Text className="text-neutral-500 font-grotesk text-sm">
                Access your teaching resources
              </Text>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-black font-groteskBold mb-2 text-sm">
                Email
              </Text>
              <View
                className="flex-row items-center bg-neutral-50 rounded-xl px-4 py-4 border-2"
                style={{
                  borderColor: emailFocused ? '#a3e635' : '#e5e5e5',
                }}>
                <Mail size={20} color="#a3a3a3" />
                <TextInput
                  className="flex-1 ml-3 text-black font-grotesk"
                  placeholder="Enter your email"
                  placeholderTextColor="#a3a3a3"
                  value={email}
                  onChangeText={(text) => setEmail(text.toLowerCase())}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-black font-groteskBold mb-2 text-sm">
                Password
              </Text>
              <View
                className="flex-row items-center bg-neutral-50 rounded-xl px-4 py-4 border-2"
                style={{
                  borderColor: passwordFocused ? '#a3e635' : '#e5e5e5',
                }}>
                <Lock size={20} color="#a3a3a3" />
                <TextInput
                  className="flex-1 ml-3 text-black font-grotesk"
                  placeholder="Enter your password"
                  placeholderTextColor="#a3a3a3"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="ml-2"
                  activeOpacity={0.7}>
                  {showPassword ? (
                    <EyeOff size={20} color="#a3a3a3" />
                  ) : (
                    <Eye size={20} color="#a3a3a3" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Teacher Secret Code Input */}
            <View className="mb-6">
              <Text className="text-black font-groteskBold mb-2 text-sm">
                Teacher Secret Code
              </Text>
              <View
                className="flex-row items-center bg-neutral-50 rounded-xl px-4 py-4 border-2"
                style={{
                  borderColor: secretCodeFocused ? '#a3e635' : '#e5e5e5',
                }}>
                <Lock size={20} color="#a3a3a3" />
                <TextInput
                  className="flex-1 ml-3 text-black font-grotesk"
                  placeholder="Enter teacher secret code"
                  placeholderTextColor="#a3a3a3"
                  value={secretCode}
                  onChangeText={setSecretCode}
                  onFocus={() => setSecretCodeFocused(true)}
                  onBlur={() => setSecretCodeFocused(false)}
                  secureTextEntry={!showSecretCode}
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowSecretCode(!showSecretCode)}
                  className="ml-2"
                  activeOpacity={0.7}>
                  {showSecretCode ? (
                    <EyeOff size={20} color="#a3a3a3" />
                  ) : (
                    <Eye size={20} color="#a3a3a3" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <Animated.View
              className="mb-6"
              style={{
                transform: [{ scale: buttonScale }],
              }}>
              <TouchableOpacity
                onPress={handleTeacherLogin}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={isLoading}
                className="bg-black rounded-xl py-4 px-6 flex-row items-center justify-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
                activeOpacity={1}>
                <Text className="text-white font-groteskBold text-base mr-2">
                  {isLoading
                    ? isVerifyingCode
                      ? "Verifying Code..."
                      : "Signing In..."
                    : "Teacher Login"
                  }
                </Text>
                {!isLoading && <ArrowRight size={20} color="white" />}
              </TouchableOpacity>
            </Animated.View>

            {/* Already have account link */}
            <View className="flex-row justify-center items-center mb-6">
              <Text className="text-neutral-500 font-grotesk">
                New teacher?
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/teacher/register")}
                disabled={isLoading}
                activeOpacity={0.7}>
                <Text className="text-black font-groteskBold ml-1">
                  Register Here
                </Text>
              </TouchableOpacity>
            </View>

            {/* Student Login Link */}
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              disabled={isLoading}
              activeOpacity={0.7}
              className="bg-neutral-50 border border-neutral-200 rounded-xl p-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
              <View className="flex-row items-center justify-center">
                <Users size={20} color="#a3a3a3" />
                <Text className="text-neutral-500 font-grotesk ml-2 mr-1">
                  Student?
                </Text>
                <Text className="text-black font-groteskBold">
                  Student Login
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
