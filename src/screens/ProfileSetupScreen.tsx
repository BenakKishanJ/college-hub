import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 pb-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mb-6 self-start p-2 -ml-2"
          activeOpacity={0.7}
        >
          <Text className="text-gray-900 text-sm font-medium">← Back</Text>
        </TouchableOpacity>
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            Complete Your Profile
          </Text>
          <Text className="text-gray-600 text-sm">
            Tell us a bit about yourself to get started
          </Text>
        </View>
      </View>

      <View className="px-6">
        <View className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">Full Name</Text>
            <TextInput
              className="w-full h-11 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:border-gray-900"
              placeholder="Enter your full name"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                setError("");
              }}
              editable={!loading}
            />
          </View>

          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">Role</Text>
            <View className="border border-gray-300 rounded-md bg-white">
              <Picker
                selectedValue={role}
                onValueChange={(value: string) => {
                  setRole(value);
                  setError("");
                }}
                style={{ height: 44 }}
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
            <Text className="text-sm font-medium text-gray-900">
              Department
            </Text>
            <View className="border border-gray-300 rounded-md bg-white">
              <Picker
                selectedValue={department}
                onValueChange={(value: string) => {
                  setDepartment(value);
                  setError("");
                }}
                style={{ height: 44 }}
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
              <Text className="text-sm font-medium text-gray-900">
                Semester
              </Text>
              <View className="border border-gray-300 rounded-md bg-white">
                <Picker
                  selectedValue={semester}
                  onValueChange={(value: string) => {
                    setSemester(value);
                    setError("");
                  }}
                  style={{ height: 44 }}
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
            <Text className="text-sm font-medium text-gray-900">
              Phone Number
            </Text>
            <Text className="text-xs text-gray-500 -mt-1">Optional</Text>
            <TextInput
              className="w-full h-11 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:border-gray-900"
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
            <View className="p-3 bg-red-50 border border-red-200 rounded-md">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`w-full h-11 rounded-md items-center justify-center ${loading ? "bg-gray-400" : "bg-gray-900 active:bg-gray-800"}`}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text className="text-white font-medium text-sm">
              {loading ? "Saving..." : "Complete Profile"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-1 items-center justify-center">
        <Button
          title="Ping Appwrite"
          onPress={() => navigation.navigate("PingAppwrite" as never)}
        />
      </View>
    </SafeAreaView>
  );
}
