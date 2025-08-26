// app/auth/login.tsx
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
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  Users,
} from "lucide-react-native";
import { Card } from "../../components/ui/card";
import { Button, ButtonText } from "../../components/ui/button";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const { login } = useAuth();

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // AuthGuard will automatically redirect to tabs
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setIsLoading(false);
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
          {/* Header Section */}
          <View className="flex-1 justify-center px-6 py-8">
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
              className="items-center mb-12"
            >
              {/* Logo/Icon */}
              <View className="bg-lime-400 rounded-full p-6 mb-6">
                <GraduationCap size={48} color="black" />
              </View>

              {/* App Title */}
              <Text className="text-4xl font-groteskBold text-black text-center mb-2">
                College Hub
              </Text>
              <Text className="text-neutral-400 font-grotesk text-center text-lg">
                Your academic companion
              </Text>
            </Animated.View>

            {/* Login Form */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Card className="bg-white border border-neutral-200 p-6 mb-6">
                <View className="mb-6">
                  <Text className="text-2xl font-groteskBold text-black text-center mb-2">
                    Welcome Back
                  </Text>
                  <Text className="text-neutral-400 font-grotesk text-center">
                    Sign in to continue your journey
                  </Text>
                </View>
                {/* Email Input */}
                <View className="mb-4">
                  <Text className="text-black font-groteskBold mb-2">
                    Email
                  </Text>
                  <View className="flex-row items-center bg-neutral-200 rounded-lg px-4 py-3 border border-neutral-200 focus:border-lime-400">
                    <Mail size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter your email"
                      placeholderTextColor="#a3a3a3"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>
                {/* Password Input */}
                <View className="mb-6">
                  <Text className="text-black font-groteskBold mb-2">
                    Password
                  </Text>
                  <View className="flex-row items-center bg-neutral-200 rounded-lg px-4 py-3 border border-neutral-200 focus:border-lime-400">
                    <Lock size={20} color="#a3a3a3" />
                    <TextInput
                      className="flex-1 ml-3 text-black font-grotesk"
                      placeholder="Enter your password"
                      placeholderTextColor="#a3a3a3"
                      value={password}
                      onChangeText={setPassword}
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
                {/* Login Button */}
                <Button
                  variant="solid"
                  size="md"
                  action="primary"
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <ButtonText>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </ButtonText>
                  {!isLoading && <ArrowRight size={20} color="white" />}
                </Button>{" "}
              </Card>

              {/* Navigation Links */}
              <View className="space-y-4">
                {/* Teacher Login Link */}
                <TouchableOpacity
                  onPress={() => router.push("/auth/teacher/login")}
                  disabled={isLoading}
                  className="bg-white border border-neutral-200 rounded-lg p-4"
                >
                  <View className="flex-row items-center justify-center">
                    <Users size={20} color="#a3a3a3" />
                    <Text className="text-neutral-400 font-grotesk ml-2 mr-1">
                      Teacher?
                    </Text>
                    <Text className="text-black font-groteskBold">
                      Teacher Login
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Register Link */}
                <View className="flex-row justify-center items-center">
                  <Text className="text-neutral-400 font-grotesk">
                    Don't have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/auth/register")}
                    disabled={isLoading}
                  >
                    <Text className="text-black font-groteskBold">
                      Register
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
