import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./utils/firebaseConfig";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileSetupScreen from "./screens/ProfileSetupScreen";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootStackParamList } from "./types/navigation";
import "../global.css";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          // Check if user has completed profile setup
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          setHasProfile(
            userDoc.exists() && userDoc.data()?.profileComplete === true,
          );
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
        setHasProfile(false);
      } finally {
        setLoading(false);
        if (initializing) setInitializing(false);
      }
    });

    return unsubscribe;
  }, [initializing]);

  // Show loading screen while checking auth state
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
          {user ? (
            hasProfile ? (
              <Stack.Screen name="Home" component={HomeScreen} />
            ) : (
              <Stack.Screen
                name="ProfileSetup"
                component={ProfileSetupScreen}
                initialParams={{ isExistingUser: true }}
              />
            )
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
