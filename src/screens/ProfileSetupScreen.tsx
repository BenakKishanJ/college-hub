import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import { RootStackParamList } from "../types/navigation";
import { updateUserProfile, getCurrentUserProfile } from "../utils/authUtils";
import { account } from "../utils/appwriteConfig";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  email?: string;
  password?: string;
  isExistingUser?: boolean;
}

export default function ProfileSetupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { email, password, isExistingUser } = route.params as RouteParams;
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    { label: "Select Role", value: "" },
    { label: "Student", value: "student" },
    { label: "Teacher", value: "teacher" },
  ];

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
    { label: "All Semesters", value: "All" },
  ];

  useEffect(() => {
    if (isExistingUser) {
      const fetchProfile = async () => {
        const profile = await getCurrentUserProfile();
        if (profile) {
          setDisplayName(profile.displayName || "");
          setRole(profile.role || "");
          setDepartment(profile.department || "");
          setSemester(profile.semester || "");
          setPhoneNumber(profile.phoneNumber || "");
        }
      };
      fetchProfile();
    }
  }, [isExistingUser]);

  const handleSubmit = async () => {
    if (!displayName.trim()) return setError("Please enter your name");
    if (!role) return setError("Please select a role");
    if (!department) return setError("Please select a department");
    if (role === "student" && !semester)
      return setError("Please select a semester");

    setLoading(true);
    try {
      const user = await account.get();
      const userEmail = email || user.email; // Use route.params.email or fetch from account
      await updateUserProfile(user.$id, {
        displayName: displayName.trim(),
        role,
        department,
        semester: role === "student" ? semester : "",
        phoneNumber: phoneNumber.trim(),
        profileComplete: true,
        email: userEmail,
      });
      navigation.navigate("Main");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-8">
        <Text className="text-3xl font-black text-black mb-2 tracking-tight">
          Complete Your Profile
        </Text>
        <Text className="text-gray-500 text-base leading-6">
          Tell us a bit about yourself
        </Text>
      </View>
      <View className="px-6 space-y-6">
        <View className="space-y-2">
          <Text className="text-sm font-medium text-black">Name *</Text>
          <TextInput
            className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
            placeholder="Enter your name"
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              setError("");
            }}
            editable={!loading}
          />
        </View>
        <View className="space-y-2">
          <Text className="text-sm font-medium text-black">Role *</Text>
          <View className="border border-gray-200 rounded-lg bg-white">
            <Picker
              selectedValue={role}
              onValueChange={(value: string) => {
                setRole(value);
                setError("");
              }}
              style={{ height: 48 }}
              enabled={!loading}
            >
              {roles.map((item) => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </Picker>
          </View>
        </View>
        <View className="space-y-2">
          <Text className="text-sm font-medium text-black">Department *</Text>
          <View className="border border-gray-200 rounded-lg bg-white">
            <Picker
              selectedValue={department}
              onValueChange={(value: string) => {
                setDepartment(value);
                setError("");
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
        {role === "student" && (
          <View className="space-y-2">
            <Text className="text-sm font-medium text-black">Semester *</Text>
            <View className="border border-gray-200 rounded-lg bg-white">
              <Picker
                selectedValue={semester}
                onValueChange={(value: string) => {
                  setSemester(value);
                  setError("");
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
        <View className="space-y-2">
          <Text className="text-sm font-medium text-black">
            Phone Number (Optional)
          </Text>
          <TextInput
            className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              setError("");
            }}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>
        {error && (
          <View className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <Text className="text-red-600 text-sm text-center">{error}</Text>
          </View>
        )}
        <TouchableOpacity
          className={`w-full h-12 rounded-lg items-center justify-center ${loading ? "bg-gray-400" : "bg-black active:bg-gray-800"}`}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Saving..." : "Save Profile"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
