// auth/teacher/register.tsx
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
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { verifyTeacherSecretCode } from "../../../lib/appwrite";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [displayNameFocused, setDisplayNameFocused] = useState(false);
  const [secretCodeFocused, setSecretCodeFocused] = useState(false);

  // Animations
  const [buttonScale] = useState(new Animated.Value(1));

  const { register } = useAuth();
  const backgroundImage = require('@/assets/images/drait.png');
  const logoImage = require('@/assets/logo.png');

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

          {/* Register Card - Full Width, Covers Rest of Screen */}
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
                Your academic companion
              </Text>
            </View>

            {/* Register Header */}
            <View className="mb-6">
              <Text className="text-2xl font-groteskBold text-black mb-1">
                Teacher Registration
              </Text>
              <Text className="text-neutral-500 font-grotesk text-sm">
                Create your teacher account
              </Text>
            </View>

            {/* Full Name Input */}
            <View className="mb-4">
              <Text className="text-black font-groteskBold mb-2 text-sm">
                Full Name
              </Text>
              <View
                className="flex-row items-center bg-neutral-50 rounded-xl px-4 py-4 border-2"
                style={{
                  borderColor: displayNameFocused ? '#a3e635' : '#e5e5e5',
                }}>
                <User size={20} color="#a3a3a3" />
                <TextInput
                  className="flex-1 ml-3 text-black font-grotesk"
                  placeholder="Enter your full name"
                  placeholderTextColor="#a3a3a3"
                  value={formData.displayName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, displayName: text })
                  }
                  onFocus={() => setDisplayNameFocused(true)}
                  onBlur={() => setDisplayNameFocused(false)}
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
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
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text.toLowerCase() })
                  }
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
                  placeholder="Create a password (min. 8 characters)"
                  placeholderTextColor="#a3a3a3"
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
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

            {/* Confirm Password Input */}
            <View className="mb-4">
              <Text className="text-black font-groteskBold mb-2 text-sm">
                Confirm Password
              </Text>
              <View
                className="flex-row items-center bg-neutral-50 rounded-xl px-4 py-4 border-2"
                style={{
                  borderColor: confirmPasswordFocused ? '#a3e635' : '#e5e5e5',
                }}>
                <Lock size={20} color="#a3a3a3" />
                <TextInput
                  className="flex-1 ml-3 text-black font-grotesk"
                  placeholder="Confirm your password"
                  placeholderTextColor="#a3a3a3"
                  value={formData.confirmPassword}
                  onChangeText={(text) =>
                    setFormData({ ...formData, confirmPassword: text })
                  }
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  secureTextEntry={!showConfirmPassword}
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2"
                  activeOpacity={0.7}>
                  {showConfirmPassword ? (
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
                  value={formData.secretCode}
                  onChangeText={(text) =>
                    setFormData({ ...formData, secretCode: text })
                  }
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

            {/* Register Button */}
            <Animated.View
              className="mb-6"
              style={{
                transform: [{ scale: buttonScale }],
              }}>
              <TouchableOpacity
                onPress={handleTeacherRegister}
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
                      : "Creating Account..."
                    : "Register as Teacher"
                  }
                </Text>
                {!isLoading && <UserPlus size={20} color="white" />}
              </TouchableOpacity>
            </Animated.View>

            {/* Already have account link */}
            <View className="flex-row justify-center items-center mb-6">
              <Text className="text-neutral-500 font-grotesk">
                Already have an account?
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/teacher/login")}
                disabled={isLoading}
                activeOpacity={0.7}>
                <Text className="text-black font-groteskBold ml-1">
                  Teacher Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
