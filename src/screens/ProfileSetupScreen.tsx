import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { signUp } from "../utils/authUtils";
import { auth, db } from "../utils/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  route: {
    params?: {
      email?: string;
      password?: string;
      isExistingUser?: boolean;
    };
  };
};

export default function ProfileSetupScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const params = route.params || {};
  const { email, password, isExistingUser = false } = params;

  const departments = [
    { label: "Select Department", value: "" },
    { label: "Computer Science", value: "Computer Science" },
    { label: "Mechanical Engineering", value: "Mechanical Engineering" },
    { label: "Electrical Engineering", value: "Electrical Engineering" },
    { label: "Civil Engineering", value: "Civil Engineering" },
    {
      label: "Electronics & Communication",
      value: "Electronics & Communication",
    },
    { label: "Information Technology", value: "Information Technology" },
    { label: "All Departments", value: "All" },
  ];

  const semesters = [
    { label: "Select Semester", value: "" },
    { label: "1st Semester", value: "1st" },
    { label: "2nd Semester", value: "2nd" },
    { label: "3rd Semester", value: "3rd" },
    { label: "4th Semester", value: "4th" },
    { label: "5th Semester", value: "5th" },
    { label: "6th Semester", value: "6th" },
    { label: "7th Semester", value: "7th" },
    { label: "8th Semester", value: "8th" },
  ];

  const validateForm = () => {
    if (!displayName.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!role) {
      setError("Please select your role");
      return false;
    }
    if (!department) {
      setError("Please select your department");
      return false;
    }
    if (role === "student" && !semester) {
      setError("Please select your semester");
      return false;
    }
    if (
      phoneNumber &&
      !/^[+]?[\d\s-()]{10,}$/.test(phoneNumber.replace(/\s/g, ""))
    ) {
      setError("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        displayName: displayName.trim(),
        role: role as "student" | "teacher",
        department,
        semester: role === "student" ? semester : "All",
        phoneNumber: phoneNumber.trim(),
        profileComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isExistingUser && auth.currentUser) {
        // User is already authenticated, just update profile
        await setDoc(doc(db, "users", auth.currentUser.uid), profileData, {
          merge: true,
        });
        Alert.alert("Success", "Profile setup completed successfully!");
      } else if (email && password) {
        // New user signup
        await signUp(email, password, profileData);
        Alert.alert("Success", "Account created and profile setup completed!");
      } else {
        throw new Error("Missing authentication information");
      }

      // Navigation will be handled by auth state change in App.tsx
    } catch (err: any) {
      console.error("Profile setup error:", err);
      setError(
        err.message || "Failed to complete profile setup. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (isExistingUser) {
      // Can't go back if user is already authenticated but missing profile
      Alert.alert(
        "Profile Required",
        "Please complete your profile to continue using the app.",
      );
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-8">
          {!isExistingUser && (
            <TouchableOpacity
              onPress={handleGoBack}
              className="mb-6 self-start p-2 -ml-2"
              activeOpacity={0.7}
            >
              <Text className="text-black text-base">← Back</Text>
            </TouchableOpacity>
          )}

          <View className="mb-8">
            <Text className="text-3xl font-black text-black mb-2 tracking-tight">
              Set up your profile
            </Text>
            <Text className="text-gray-500 text-base leading-6">
              Tell us a bit about yourself to personalize your experience
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="px-6 space-y-6">
          {/* Display Name */}
          <View className="space-y-2">
            <Text className="text-sm font-medium text-black">Full Name *</Text>
            <TextInput
              className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (error) setError("");
              }}
              autoComplete="name"
              editable={!loading}
            />
          </View>

          {/* Phone Number */}
          <View className="space-y-2">
            <Text className="text-sm font-medium text-black">
              Phone Number (Optional)
            </Text>
            <TextInput
              className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (error) setError("");
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!loading}
            />
          </View>

          {/* Role */}
          <View className="space-y-2">
            <Text className="text-sm font-medium text-black">I am a *</Text>
            <View className="border border-gray-200 rounded-lg bg-white">
              <Picker
                selectedValue={role}
                onValueChange={(value: string) => {
                  setRole(value);
                  if (value === "teacher") {
                    setSemester(""); // Reset semester for teachers
                  }
                  if (error) setError("");
                }}
                style={{ height: 48 }}
                enabled={!loading}
              >
                <Picker.Item label="Select Role" value="" />
                <Picker.Item label="Student" value="student" />
                <Picker.Item label="Teacher" value="teacher" />
              </Picker>
            </View>
          </View>

          {/* Department */}
          <View className="space-y-2">
            <Text className="text-sm font-medium text-black">Department *</Text>
            <View className="border border-gray-200 rounded-lg bg-white">
              <Picker
                selectedValue={department}
                onValueChange={(value: string) => {
                  setDepartment(value);
                  if (error) setError("");
                }}
                style={{ height: 48 }}
                enabled={!loading}
              >
                {departments.map((dept) => (
                  <Picker.Item
                    key={dept.value}
                    label={dept.label}
                    value={dept.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Semester (for students only) */}
          {role === "student" && (
            <View className="space-y-2">
              <Text className="text-sm font-medium text-black">Semester *</Text>
              <View className="border border-gray-200 rounded-lg bg-white">
                <Picker
                  selectedValue={semester}
                  onValueChange={(value: string) => {
                    setSemester(value);
                    if (error) setError("");
                  }}
                  style={{ height: 48 }}
                  enabled={!loading}
                >
                  {semesters.map((sem) => (
                    <Picker.Item
                      key={sem.value}
                      label={sem.label}
                      value={sem.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Error Message */}
          {error ? (
            <View className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Submit Button */}
        <View className="px-6 py-6 mt-8">
          <TouchableOpacity
            className={`w-full h-12 rounded-lg items-center justify-center ${
              loading ? "bg-gray-400" : "bg-black active:bg-gray-800"
            }`}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Complete Setup
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
