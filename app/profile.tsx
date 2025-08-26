// app/profile.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { databases, APPWRITE_CONFIG } from "../lib/appwrite";
import {
  User,
  Mail,
  Building,
  BookOpen,
  Phone,
  Save,
  Edit3,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  Key,
} from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { AuthGuard } from "../components/AuthGuard";

// Define department options
const DEPARTMENT_OPTIONS = [
  "Computer Science",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication",
  "Information Technology",
  "Chemical Engineering",
  "Biotechnology",
  "Aerospace Engineering",
  "Other",
];

// Define semester options
const SEMESTER_OPTIONS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
];

export default function ProfileScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    displayName: "",
    department: "",
    semester: "",
    phoneNumber: "",
  });

  // Check if profile is complete
  const isProfileComplete = () => {
    if (!user) return false;
    return Boolean(
      user.displayName &&
      user.department &&
      (user.role !== "student" || user.semester) &&
      user.phoneNumber,
    );
  };

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        department: user.department || "",
        semester: user.semester || "",
        phoneNumber: user.phoneNumber || "",
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    // Basic validation
    if (!formData.displayName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!formData.department) {
      Alert.alert("Error", "Please select your department");
      return;
    }

    if (user.role === "student" && !formData.semester) {
      Alert.alert("Error", "Please select your semester");
      return;
    }

    if (!formData.phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    setIsSaving(true);

    try {
      // Calculate profile completeness
      const profileComplete = Boolean(
        formData.displayName.trim() &&
        formData.department &&
        (user.role !== "student" || formData.semester) &&
        formData.phoneNumber.trim(),
      );

      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        user.$id,
        {
          displayName: formData.displayName.trim(),
          department: formData.department,
          semester: formData.semester,
          phoneNumber: formData.phoneNumber.trim(),
          profileComplete,
        },
      );

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        department: user.department || "",
        semester: user.semester || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading || authLoading) {
    return (
      <AuthGuard>
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white mt-4">Loading profile...</Text>
          </View>
        </SafeAreaView>
      </AuthGuard>
    );
  }

  if (!user) {
    return (
      <AuthGuard>
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-lg text-gray-400">
              Please log in to view your profile
            </Text>
          </View>
        </SafeAreaView>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="px-6 py-4 border-b border-gray-800">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => router.back()} className="p-2">
                <X size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-white">Profile</Text>
              <View className="w-10" /> {/* Spacer for balance */}
            </View>
          </View>

          {/* Profile Completion Banner */}
          {!isProfileComplete() && (
            <View className="bg-yellow-900 border-b border-yellow-700 px-6 py-4">
              <View className="flex-row items-center">
                <AlertCircle size={20} color="#FBBF24" />
                <Text className="text-yellow-200 ml-3 flex-1">
                  Complete your profile to access all features
                </Text>
              </View>
            </View>
          )}

          {/* Profile Card */}
          <View className="px-6 py-6">
            {/* User Role Badge */}
            <View className="mb-6">
              <View
                className={`inline-flex px-3 py-1 rounded-full ${user.role === "teacher" ? "bg-purple-900" : "bg-blue-900"
                  }`}
              >
                <Text
                  className={`text-sm font-medium ${user.role === "teacher"
                      ? "text-purple-200"
                      : "text-blue-200"
                    }`}
                >
                  {user.role?.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Profile Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View className="bg-gray-800 rounded-full w-16 h-16 items-center justify-center mr-4">
                  <User size={28} color="white" />
                </View>
                <View>
                  {!isEditing ? (
                    <Text className="text-xl font-semibold text-white">
                      {user.displayName || "No name set"}
                    </Text>
                  ) : (
                    <TextInput
                      className="text-xl font-semibold text-white border-b-2 border-blue-500 pb-1"
                      value={formData.displayName}
                      onChangeText={(text) =>
                        setFormData({ ...formData, displayName: text })
                      }
                      placeholder="Enter your name"
                      placeholderTextColor="#6B7280"
                    />
                  )}
                  <Text className="text-gray-400">{user.email}</Text>
                </View>
              </View>

              {!isEditing ? (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="bg-gray-800 p-3 rounded-lg"
                >
                  <Edit3 size={20} color="white" />
                </TouchableOpacity>
              ) : (
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={handleCancel}
                    className="bg-gray-800 p-3 rounded-lg"
                  >
                    <X size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className="bg-white p-3 rounded-lg"
                    style={{ opacity: isSaving ? 0.7 : 1 }}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="black" size="small" />
                    ) : (
                      <Save size={20} color="black" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Profile Details */}
            <View className="space-y-4">
              {/* Department */}
              <View className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <View className="flex-row items-center mb-2">
                  <Building size={18} color="#6B7280" />
                  <Text className="text-gray-400 ml-2">Department</Text>
                </View>
                {!isEditing ? (
                  <Text className="text-white text-lg">
                    {user.department || "Not set"}
                  </Text>
                ) : (
                  <View className="border border-gray-700 rounded-lg bg-gray-800">
                    <Picker
                      selectedValue={formData.department}
                      onValueChange={(value) =>
                        setFormData({ ...formData, department: value })
                      }
                      style={{ color: "white", height: 50 }}
                      dropdownIconColor="white"
                    >
                      <Picker.Item
                        label="Select Department"
                        value=""
                        color="#6B7280"
                      />
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <Picker.Item
                          key={dept}
                          label={dept}
                          value={dept}
                          color="white"
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>

              {/* Semester (Only for students) */}
              {user.role === "student" && (
                <View className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <View className="flex-row items-center mb-2">
                    <BookOpen size={18} color="#6B7280" />
                    <Text className="text-gray-400 ml-2">Semester</Text>
                  </View>
                  {!isEditing ? (
                    <Text className="text-white text-lg">
                      {user.semester || "Not set"}
                    </Text>
                  ) : (
                    <View className="border border-gray-700 rounded-lg bg-gray-800">
                      <Picker
                        selectedValue={formData.semester}
                        onValueChange={(value) =>
                          setFormData({ ...formData, semester: value })
                        }
                        style={{ color: "white", height: 50 }}
                        dropdownIconColor="white"
                      >
                        <Picker.Item
                          label="Select Semester"
                          value=""
                          color="#6B7280"
                        />
                        {SEMESTER_OPTIONS.map((sem) => (
                          <Picker.Item
                            key={sem}
                            label={sem}
                            value={sem}
                            color="white"
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                </View>
              )}

              {/* Phone Number */}
              <View className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <View className="flex-row items-center mb-2">
                  <Phone size={18} color="#6B7280" />
                  <Text className="text-gray-400 ml-2">Phone Number</Text>
                </View>
                {!isEditing ? (
                  <Text className="text-white text-lg">
                    {user.phoneNumber || "Not set"}
                  </Text>
                ) : (
                  <TextInput
                    className="text-white text-lg border border-gray-700 rounded-lg p-3 bg-gray-800"
                    value={formData.phoneNumber}
                    onChangeText={(text) =>
                      setFormData({ ...formData, phoneNumber: text })
                    }
                    placeholder="Enter phone number"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                  />
                )}
              </View>

              {/* Email (Read-only) */}
              <View className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <View className="flex-row items-center mb-2">
                  <Mail size={18} color="#6B7280" />
                  <Text className="text-gray-400 ml-2">Email</Text>
                </View>
                <Text className="text-white text-lg">{user.email}</Text>
              </View>

              {/* Profile Completion Status */}
              <View className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    {isProfileComplete() ? (
                      <CheckCircle size={18} color="#10B981" />
                    ) : (
                      <AlertCircle size={18} color="#F59E0B" />
                    )}
                    <Text className="text-gray-400 ml-2">Profile Status</Text>
                  </View>
                  <Text
                    className={`font-semibold ${isProfileComplete() ? "text-green-400" : "text-yellow-400"
                      }`}
                  >
                    {isProfileComplete() ? "Complete" : "Incomplete"}
                  </Text>
                </View>
                {!isProfileComplete() && (
                  <Text className="text-gray-400 text-sm mt-2">
                    Please fill all required fields to complete your profile
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Account Information */}
          <View className="px-6 pb-8">
            <Text className="text-xl font-bold text-white mb-4">
              Account Information
            </Text>
            <View className="space-y-3">
              <View className="flex-row items-center justify-between py-3 border-b border-gray-800">
                <View className="flex-row items-center">
                  <Calendar size={18} color="#6B7280" />
                  <Text className="text-gray-400 ml-2">Member since</Text>
                </View>
                <Text className="text-white">
                  {new Date(user.$createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-gray-800">
                <View className="flex-row items-center">
                  <Calendar size={18} color="#6B7280" />
                  <Text className="text-gray-400 ml-2">Last updated</Text>
                </View>
                <Text className="text-white">
                  {new Date(user.$updatedAt).toLocaleDateString()}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Key size={18} color="#6B7280" />
                  <Text className="text-gray-400 ml-2">User ID</Text>
                </View>
                <Text
                  className="text-gray-400 text-xs"
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {user.$id}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
}
