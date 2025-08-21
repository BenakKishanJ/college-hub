import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import {
  databases,
  APPWRITE_DATABASE_ID,
  DOCUMENTS_COLLECTION_ID,
} from "../utils/appwriteConfig";
import { getCurrentUserProfile } from "../utils/authUtils";
import { Query } from "appwrite";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Document {
  $id: string;
  title: string;
  category: string;
  fileUrl: string;
  targets: { departments: string[]; semesters: string[] };
  createdAt: string;
}

export default function DocumentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const profile = await getCurrentUserProfile();
        if (!profile) {
          setError("User profile not found");
          return;
        }

        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          DOCUMENTS_COLLECTION_ID,
          [Query.limit(100)],
        );
        const userDocs: Document[] = response.documents
          .filter((doc) => {
            const isTeacher = profile.role === "teacher";
            const matchesDepartment =
              doc.targets.departments.length === 0 ||
              doc.targets.departments.includes(profile.department);
            const matchesSemester =
              doc.targets.semesters.length === 0 ||
              doc.targets.semesters.includes(profile.semester || "All");
            return isTeacher || (matchesDepartment && matchesSemester);
          })
          .map((doc) => ({
            $id: doc.$id,
            title: doc.title,
            category: doc.category,
            fileUrl: doc.fileUrl,
            targets: doc.targets,
            createdAt: doc.createdAt,
          }));
        setDocuments(userDocs);
      } catch (err: any) {
        setError(err.message || "Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const openDocument = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Error", "Failed to open document");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mb-6 self-start p-2 -ml-2"
          activeOpacity={0.7}
        >
          <Text className="text-black text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-black text-black mb-2 tracking-tight">
          Documents
        </Text>
        <Text className="text-gray-500 text-base leading-6">
          Browse available documents
        </Text>
      </View>
      {error && (
        <View className="px-6">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      )}
      <FlatList
        data={documents}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="px-6 py-4 bg-white border-b border-gray-100 active:bg-gray-50"
            onPress={() => openDocument(item.fileUrl)}
            activeOpacity={0.7}
          >
            <Text className="font-semibold text-black">{item.title}</Text>
            <Text className="text-gray-600 text-sm">
              {item.category} •{" "}
              {item.targets.departments.join(", ") || "All Departments"} •{" "}
              {item.targets.semesters.join(", ") || "All Semesters"}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Uploaded: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="px-6 py-4">
            <Text className="text-gray-600 text-center">
              No documents available
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
