// app/_layout.tsx
import { useEffect } from "react";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text, View, ActivityIndicator } from "react-native";
import AuthProvider from "../context/AuthContext";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { AuthGuard } from "../components/AuthGuard";
import { NotificationProvider } from '@/context/NotificaitonContext';
import { useNotifications } from '../hooks/useNotifications'; // ADD THIS IMPORT
import "../global.css";
import { useAuth } from '../context/AuthContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a component that initializes notifications
function NotificationInitializer() {
  const { user } = useAuth();
  const { expoPushToken, registerForPushNotificationsAsync } = useNotifications();

  useEffect(() => {
    // If user changes and doesn't have a push token, try to register
    if (user && !user.pushToken && !expoPushToken) {
      registerForPushNotificationsAsync();
    }
  }, [user, expoPushToken]);

  return null;
}
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "SpaceGrotesk-Regular": require("../assets/fonts/SpaceGrotesk-Regular.ttf"),
    "SpaceGrotesk-Bold": require("../assets/fonts/SpaceGrotesk-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <GluestackUIProvider mode="light">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </GluestackUIProvider>
    );
  }

  if (fontError) {
    return (
      <GluestackUIProvider mode="light">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Error loading fonts. Please restart the app.</Text>
        </View>
      </GluestackUIProvider>
    );
  }

  return (
    <GluestackUIProvider mode="light">
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <AuthGuard>
              <NotificationInitializer /> {/* ADD THIS COMPONENT */}
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
              </Stack>
            </AuthGuard>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
