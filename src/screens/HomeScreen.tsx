import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { logout, getCurrentUserProfile } from "../utils/authUtils";
import { account } from "../utils/appwriteConfig";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
  displayName: string;
  role: string;
  department: string;
  semester?: string;
  phoneNumber?: string;
  profileComplete: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setUserProfile({
          displayName: profile.displayName,
          role: profile.role,
          department: profile.department,
          semester: profile.semester,
          phoneNumber: profile.phoneNumber,
          profileComplete: profile.profileComplete,
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (err: any) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
            console.error("Logout error:", err);
          }
        },
      },
    ]);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  const quickActions: QuickAction[] = [
    {
      id: "documents",
      title: "View Documents",
      subtitle: "Access shared notes and resources",
      icon: "📚",
      onPress: () => navigation.navigate("Documents"),
    },
    ...(userProfile?.role === "teacher"
      ? [
          {
            id: "upload",
            title: "Upload Document",
            subtitle: "Share resources with students",
            icon: "📤",
            onPress: () => navigation.navigate("Upload"),
          },
        ]
      : []),
    {
      id: "courses",
      title: "View Courses",
      subtitle: "Access your enrolled courses",
      icon: "📚",
      onPress: () =>
        Alert.alert("Coming Soon", "Courses feature will be available soon!"),
    },
    {
      id: "assignments",
      title: "Assignments",
      subtitle: "Check pending submissions",
      icon: "📝",
      onPress: () =>
        Alert.alert(
          "Coming Soon",
          "Assignments feature will be available soon!",
        ),
    },
    {
      id: "schedule",
      title: "Schedule",
      subtitle: "View your class timetable",
      icon: "📅",
      onPress: () =>
        Alert.alert("Coming Soon", "Schedule feature will be available soon!"),
    },
    {
      id: "messages",
      title: "Messages",
      subtitle: "Connect with classmates",
      icon: "💬",
      onPress: () =>
        Alert.alert("Coming Soon", "Messages feature will be available soon!"),
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: "Profile completed",
      subtitle: "Welcome to College Hub!",
      timestamp: "Just now",
      isActive: true,
    },
    {
      id: 2,
      title: "Account created",
      subtitle: "Your journey begins here",
      timestamp: "Few minutes ago",
      isActive: false,
    },
  ];

  if (loading && !userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 tracking-tight">
              College Hub
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              Welcome back, {userProfile?.displayName?.split(" ")[0] || "User"}
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 bg-gray-900 rounded-lg items-center justify-center shadow-sm"
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                "Profile",
                `Name: ${userProfile?.displayName}\nRole: ${userProfile?.role}\nDepartment: ${userProfile?.department}${userProfile?.semester ? `\nSemester: ${userProfile.semester}` : ""}`,
              )
            }
          >
            <Text className="text-white font-medium text-xs">
              {userProfile?.displayName
                ? getInitials(userProfile.displayName)
                : "U"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 mb-6">
          <View className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <View className="flex-row items-center mb-2">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              <Text className="font-medium text-gray-900">Profile Active</Text>
            </View>
            <Text className="text-gray-600 text-sm">
              {userProfile?.role === "student" ? "Student" : "Teacher"} •{" "}
              {userProfile?.department}
              {userProfile?.semester &&
                userProfile.semester !== "All" &&
                ` • ${userProfile.semester} Semester`}
            </Text>
          </View>
        </View>
        <View className="px-6 mb-6">
          <View className="flex-row space-x-3">
            <View className="flex-1 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Text className="text-2xl font-bold text-gray-900">0</Text>
              <Text className="text-gray-600 text-xs mt-1 font-medium">
                Active Courses
              </Text>
            </View>
            <View className="flex-1 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Text className="text-2xl font-bold text-gray-900">0</Text>
              <Text className="text-gray-600 text-xs mt-1 font-medium">
                Assignments
              </Text>
            </View>
          </View>
        </View>
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </Text>
          <View className="space-y-2">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm active:bg-gray-50"
                activeOpacity={0.7}
                onPress={action.onPress}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 bg-gray-900 rounded-md items-center justify-center mr-3">
                    <Text className="text-white text-sm">{action.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {action.title}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {action.subtitle}
                    </Text>
                  </View>
                  <View className="w-5 h-5 items-center justify-center">
                    <Text className="text-gray-400 text-lg">›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </Text>
          <View className="space-y-2">
            {recentActivities.map((activity) => (
              <View
                key={activity.id}
                className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <View className="flex-row items-start">
                  <View
                    className={`w-2 h-2 rounded-full mt-2 mr-3 ${activity.isActive ? "bg-gray-900" : "bg-gray-400"}`}
                  />
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900 text-sm">
                      {activity.title}
                    </Text>
                    <Text className="text-gray-600 text-xs">
                      {activity.subtitle}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">
                      {activity.timestamp}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View className="px-6 py-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          className="w-full h-11 border border-gray-300 rounded-md items-center justify-center active:bg-gray-50"
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text className="text-gray-700 font-medium text-sm">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
