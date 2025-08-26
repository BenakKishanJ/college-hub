// components/TeacherFAB.tsx
import { useAuth } from "../context/AuthContext";
import FloatingActionButton from "./FloatingActionButton";
import { router } from "expo-router";
import { View } from "react-native";

export default function TeacherFAB() {
  const { user } = useAuth();

  if (user?.role !== "teacher") {
    return null;
  }

  // Render the FAB outside of the tab content area
  return (
    <View className="absolute bottom-20 right-4 z-50">
      <FloatingActionButton
        onPress={() => router.push("/upload")}
        visible={user?.role === "teacher"}
      />
    </View>
  );
}
