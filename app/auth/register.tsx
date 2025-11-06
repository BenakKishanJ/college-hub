// app/auth/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  UserPlus,
} from "lucide-react-native";
import { Card } from "../../components/ui/card";
import { Button, ButtonText } from "../../components/ui/button";
import { Image } from "react-native";

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { register } = useAuth();
  const logoImage = require('@/assets/logo.png');

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert("Error", "Please enter your email");
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

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(formData.email, formData.password, {
        displayName: formData.displayName,
        role: "student",
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-200">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between px-6 py-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white p-2 rounded-lg border border-neutral-200"
              disabled={isLoading}>
              <ArrowLeft size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-groteskBold text-black">
              Create Account
            </Text>
            <View className="w-10" />
          </View>

          <View className="flex-1 px-6 pb-6">
            <View className="items-center mb-8">
              <View className="bg-white rounded-full p-4 mb-6 overflow-hidden">
                <Image source={logoImage} style={{ width: 120, height: 120 }} />
              </View>

              <Text className="text-3xl font-groteskBold text-black text-center mb-2">
                Join College Hub
              </Text>
              <Text className="text-neutral-400 font-grotesk text-center text-lg">
                Start your academic journey with us
              </Text>
            </View>

            <View>
              <Card className="bg-white border border-neutral-200 p-6 mb-6">
                <View className="mb-4">
                  <Text className="text-black font-groteskBold mb-2">
                    Full Name
                  </Text>
                  <View
                    className="flex-row items-center bg-neutral-50 rounded-lg px-4 py-3 border-2"
                    style={{ borderColor: focusedField === 'displayName' ? '#a3e635' : '#d4d4d8' }}>
                    <User size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter your full name"
                      placeholderTextColor="#a3a3a3"
                      value={formData.displayName}
                      onChangeText={(text) =>
                        setFormData({ ...formData, displayName: text })
                      }
                      onFocus={() => setFocusedField('displayName')}
                      onBlur={() => setFocusedField(null)}
                      editable={!isLoading}
                      autoCorrect={false}
                    />
                  </View>
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
                      value={formData.email}
                      onChangeText={(text) =>
                        setFormData({ ...formData, email: text.toLowerCase() })
                      }
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
                      placeholder="Create a password (min. 8 characters)"
                      placeholderTextColor="#a3a3a3"
                      value={formData.password}
                      onChangeText={(text) =>
                        setFormData({ ...formData, password: text })
                      }
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-2">
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
                    Confirm Password
                  </Text>
                  <View
                    className="flex-row items-center bg-neutral-50 rounded-lg px-4 py-3 border-2"
                    style={{ borderColor: focusedField === 'confirmPassword' ? '#a3e635' : '#d4d4d8' }}>
                    <Lock size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Confirm your password"
                      placeholderTextColor="#a3a3a3"
                      value={formData.confirmPassword}
                      onChangeText={(text) =>
                        setFormData({ ...formData, confirmPassword: text })
                      }
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showConfirmPassword}
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="ml-2">
                      {showConfirmPassword ? (
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
                  onPress={handleRegister}
                  disabled={isLoading}>
                  <ButtonText>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </ButtonText>
                  {!isLoading && <UserPlus size={20} color="white" />}
                </Button>
              </Card>

              <View className="flex-row justify-center items-center">
                <Text className="text-neutral-400 font-grotesk">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/auth/login")}
                  disabled={isLoading}>
                  <Text className="text-black font-groteskBold">Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
