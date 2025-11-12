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
  ArrowLeft,
  LogOut,
} from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { AuthGuard } from "../components/AuthGuard";
import { Card } from "../components/ui/card";

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
  const { user, isLoading: authLoading, logout } = useAuth();
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

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/auth");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to logout");
            }
          }
        },
      ]
    );
  };

  if (isLoading || authLoading) {
    return (
      <AuthGuard>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="black" />
            <Text className="text-black font-grotesk mt-4">
              Loading profile...
            </Text>
          </View>
        </SafeAreaView>
      </AuthGuard>
    );
  }

  if (!user) {
    return (
      <AuthGuard>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-lg text-neutral-400 font-grotesk">
              Please log in to view your profile
            </Text>
          </View>
        </SafeAreaView>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 py-4 border-b-2 border-black">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="p-2"
                activeOpacity={0.8}
              >
                <ArrowLeft size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-2xl font-groteskBold text-black">
                Profile
              </Text>
              <View className="w-10" />
            </View>
          </View>

          {/* Profile Completion Banner */}
          {!isProfileComplete() && (
            <View className="bg-lime-400 px-6 py-4 border-b-2 border-black">
              <View className="flex-row items-center">
                <AlertCircle size={20} color="black" />
                <Text className="text-black font-groteskBold ml-3 flex-1">
                  Complete your profile to access all features
                </Text>
              </View>
            </View>
          )}

          {/* Profile Content */}
          <View className="px-6 py-6">
            {/* User Role Badge */}
            <View className="mb-6">
              <View className="self-start bg-lime-400 px-4 py-2 rounded-full border-2 border-black">
                <Text className="text-black font-groteskBold text-sm">
                  {user.role?.toUpperCase() || "USER"}
                </Text>
              </View>
            </View>

            {/* Profile Header Card */}
            <Card className="bg-white border-2 border-black p-6 mb-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-black rounded-full w-16 h-16 items-center justify-center mr-4 border-2 border-black">
                    <User size={28} color="white" />
                  </View>
                  <View className="flex-1">
                    {!isEditing ? (
                      <Text className="text-xl font-groteskBold text-black mb-1">
                        {user.displayName || "No name set"}
                      </Text>
                    ) : (
                      <TextInput
                        className="text-xl font-groteskBold text-black border-b-2 border-black pb-1 mb-1"
                        value={formData.displayName}
                        onChangeText={(text) =>
                          setFormData({ ...formData, displayName: text })
                        }
                        placeholder="Enter your name"
                        placeholderTextColor="#a3a3a3"
                      />
                    )}
                    <Text className="text-neutral-500 font-grotesk">
                      {user.email}
                    </Text>
                  </View>
                </View>

                {!isEditing ? (
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    className="bg-black p-3 rounded-lg ml-4"
                    activeOpacity={0.8}
                  >
                    <Edit3 size={20} color="white" />
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row space-x-2 ml-4">
                    <TouchableOpacity
                      onPress={handleCancel}
                      className="bg-white border-2 border-black p-3 rounded-lg"
                      activeOpacity={0.8}
                    >
                      <X size={20} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      disabled={isSaving}
                      className="bg-black p-3 rounded-lg"
                      activeOpacity={0.8}
                      style={{ opacity: isSaving ? 0.7 : 1 }}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Save size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>

            {/* Profile Details */}
            <View className="space-y-4">
              {/* Department */}
              <Card className="bg-white border-2 border-black p-5">
                <View className="flex-row items-center mb-3">
                  <Building size={20} color="#000" />
                  <Text className="text-black font-groteskBold ml-2">
                    Department
                  </Text>
                </View>
                {!isEditing ? (
                  <Text className="text-black font-grotesk text-lg">
                    {user.department || "Not set"}
                  </Text>
                ) : (
                  <View className="border-2 border-black rounded-lg bg-white">
                    <Picker
                      selectedValue={formData.department}
                      onValueChange={(value) =>
                        setFormData({ ...formData, department: value })
                      }
                      style={{ color: "black", height: 50 }}
                      dropdownIconColor="black"
                    >
                      <Picker.Item
                        label="Select Department"
                        value=""
                        color="#a3a3a3"
                      />
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <Picker.Item
                          key={dept}
                          label={dept}
                          value={dept}
                          color="black"
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              </Card>

              {/* Semester (Only for students) */}
              {user.role === "student" && (
                <Card className="bg-white border-2 border-black p-5">
                  <View className="flex-row items-center mb-3">
                    <BookOpen size={20} color="#000" />
                    <Text className="text-black font-groteskBold ml-2">
                      Semester
                    </Text>
                  </View>
                  {!isEditing ? (
                    <Text className="text-black font-grotesk text-lg">
                      {user.semester || "Not set"}
                    </Text>
                  ) : (
                    <View className="border-2 border-black rounded-lg bg-white">
                      <Picker
                        selectedValue={formData.semester}
                        onValueChange={(value) =>
                          setFormData({ ...formData, semester: value })
                        }
                        style={{ color: "black", height: 50 }}
                        dropdownIconColor="black"
                      >
                        <Picker.Item
                          label="Select Semester"
                          value=""
                          color="#a3a3a3"
                        />
                        {SEMESTER_OPTIONS.map((sem) => (
                          <Picker.Item
                            key={sem}
                            label={sem}
                            value={sem}
                            color="black"
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                </Card>
              )}

              {/* Phone Number */}
              <Card className="bg-white border-2 border-black p-5">
                <View className="flex-row items-center mb-3">
                  <Phone size={20} color="#000" />
                  <Text className="text-black font-groteskBold ml-2">
                    Phone Number
                  </Text>
                </View>
                {!isEditing ? (
                  <Text className="text-black font-grotesk text-lg">
                    {user.phoneNumber || "Not set"}
                  </Text>
                ) : (
                  <TextInput
                    className="text-black font-grotesk text-lg border-2 border-black rounded-lg p-3 bg-white"
                    value={formData.phoneNumber}
                    onChangeText={(text) =>
                      setFormData({ ...formData, phoneNumber: text })
                    }
                    placeholder="Enter phone number"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="phone-pad"
                  />
                )}
              </Card>

              {/* Email (Read-only) */}
              <Card className="bg-white border-2 border-black p-5">
                <View className="flex-row items-center mb-3">
                  <Mail size={20} color="#000" />
                  <Text className="text-black font-groteskBold ml-2">
                    Email
                  </Text>
                </View>
                <Text className="text-black font-grotesk text-lg">
                  {user.email}
                </Text>
              </Card>

              {/* Profile Completion Status */}
              <Card className="bg-white border-2 border-black p-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    {isProfileComplete() ? (
                      <CheckCircle size={20} color="#000" />
                    ) : (
                      <AlertCircle size={20} color="#000" />
                    )}
                    <Text className="text-black font-groteskBold ml-2">
                      Profile Status
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full border-2 border-black ${isProfileComplete() ? "bg-lime-400" : "bg-white"
                      }`}
                  >
                    <Text className="font-groteskBold text-black text-sm">
                      {isProfileComplete() ? "Complete" : "Incomplete"}
                    </Text>
                  </View>
                </View>
                {!isProfileComplete() && (
                  <Text className="text-neutral-500 font-grotesk text-sm mt-3">
                    Please fill all required fields to complete your profile
                  </Text>
                )}
              </Card>
            </View>
          </View>

          {/* Account Information Section */}
          <View className="px-6 pb-6">
            <Text className="text-xl font-groteskBold text-black mb-4">
              Account Information
            </Text>

            <Card className="bg-white border-2 border-black p-5">
              <View className="space-y-4">
                <View className="flex-row items-center justify-between py-2 border-b border-neutral-200">
                  <View className="flex-row items-center">
                    <Calendar size={18} color="#000" />
                    <Text className="text-black font-grotesk ml-2">
                      Member since
                    </Text>
                  </View>
                  <Text className="text-black font-grotesk">
                    {new Date(user.$createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-neutral-200">
                  <View className="flex-row items-center">
                    <Calendar size={18} color="#000" />
                    <Text className="text-black font-grotesk ml-2">
                      Last updated
                    </Text>
                  </View>
                  <Text className="text-black font-grotesk">
                    {new Date(user.$updatedAt).toLocaleDateString()}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <Key size={18} color="#000" />
                    <Text className="text-black font-grotesk ml-2">
                      User ID
                    </Text>
                  </View>
                  <Text
                    className="text-neutral-500 font-grotesk text-xs"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {user.$id}
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Logout Button */}
          <View className="px-6 pb-8">
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-black py-4 rounded-xl flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <LogOut size={20} color="white" />
              <Text className="text-white font-groteskBold text-lg ml-2">
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
}
