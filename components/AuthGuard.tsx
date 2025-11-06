// components/AuthGuard.tsx
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View, Text } from "react-native";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait until auth state is loaded

    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not already on auth page
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth pages
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5"
        }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Wrap children in a View to avoid fragment issues
  return (<View style={{ flex: 1 }}>{children}</View>);
}
