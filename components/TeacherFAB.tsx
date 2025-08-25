// components/TeacherFAB.tsx
import { useAuth } from "../context/AuthContext";
import FloatingActionButton from "./FloatingActionButton";
import { router } from "expo-router";

export default function TeacherFAB() {
  const { user } = useAuth();

  if (user?.role !== "teacher") {
    return null;
  }

  return (
    <FloatingActionButton
      onPress={() => router.push("/upload")}
      visible={user?.role === "teacher"}
    />
  );
}
