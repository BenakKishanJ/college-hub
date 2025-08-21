import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, ActivityIndicator } from "react-native";
import { RootStackParamList } from "./types/navigation";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileSetupScreen from "./screens/ProfileSetupScreen";
import DocumentsScreen from "./screens/DocumentsScreen";
import UploadScreen from "./screens/UploadScreen";
import { account } from "./utils/appwriteConfig";
import { getCurrentUserProfile } from "./utils/authUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

interface TabBarIconProps {
  color: string;
  size: number;
}

function MainTabs() {
  const [department, setDepartment] = useState("Hub");

  useEffect(() => {
    const fetchDepartment = async () => {
      const profile = await getCurrentUserProfile();
      if (profile?.department && profile.department !== "All") {
        setDepartment(profile.department);
      }
    };
    fetchDepartment();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#e5e7eb" },
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Department"
        component={DocumentsScreen}
        options={{
          tabBarLabel: department,
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <MaterialCommunityIcons name="school" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Academics"
        component={DocumentsScreen}
        options={{
          tabBarLabel: "Academics",
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <MaterialCommunityIcons
              name="book-open"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Opportunities"
        component={DocumentsScreen}
        options={{
          tabBarLabel: "Opportunities",
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <MaterialCommunityIcons
              name="lightbulb"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        const profile = await getCurrentUserProfile();
        setHasProfile(!!profile && profile.profileComplete === true);
        setIsTeacher(profile?.role === "teacher");
      } catch (error) {
        setUser(null);
        setHasProfile(false);
        setIsTeacher(false);
      } finally {
        setLoading(false);
        if (initializing) setInitializing(false);
      }
    };
    checkSession();
  }, [initializing]);

  if (loading || initializing) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-gray-600 mt-4 text-base">Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationDuration: 200,
          }}
        >
          {user && hasProfile ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              {isTeacher && (
                <Stack.Screen name="Upload" component={UploadScreen} />
              )}
              <Stack.Screen name="Documents" component={DocumentsScreen} />
            </>
          ) : user ? (
            <Stack.Screen
              name="ProfileSetup"
              component={ProfileSetupScreen}
              initialParams={{ isExistingUser: true }}
            />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen
                name="ProfileSetup"
                component={ProfileSetupScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
