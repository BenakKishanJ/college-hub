import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  ScrollView,
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
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 pb-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mb-6 self-start p-2 -ml-2"
          activeOpacity={0.7}
        >
          <Text className="text-gray-900 text-sm font-medium">← Back</Text>
        </TouchableOpacity>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            Documents
          </Text>
          <Text className="text-gray-600 text-sm">
            Browse and access available resources
          </Text>
        </View>
      </View>

      {error && (
        <View className="px-6 mb-4">
          <View className="p-3 bg-red-50 border border-red-200 rounded-md">
            <Text className="text-red-600 text-sm text-center">{error}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={documents}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mb-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm active:bg-gray-50"
            onPress={() => openDocument(item.fileUrl)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-gray-900 text-base mb-1">
                  {item.title}
                </Text>
                <View className="flex-row items-center">
                  <View className="px-2 py-1 bg-gray-100 rounded-md mr-2">
                    <Text className="text-gray-700 text-xs font-medium">
                      {item.category}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="w-8 h-8 bg-gray-900 rounded-md items-center justify-center">
                <Text className="text-white text-sm">📄</Text>
              </View>
            </View>

            <View className="space-y-1">
              <Text className="text-gray-600 text-xs">
                Departments: {item.targets.departments.join(", ") || "All"}
              </Text>
              <Text className="text-gray-600 text-xs">
                Semesters: {item.targets.semesters.join(", ") || "All"}
              </Text>
              <Text className="text-gray-500 text-xs mt-2">
                Uploaded {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="mt-12">
            <View className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mx-6">
              <View className="items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center mb-4">
                  <Text className="text-gray-400 text-xl">📄</Text>
                </View>
                <Text className="text-gray-900 font-medium text-base mb-1">
                  No documents yet
                </Text>
                <Text className="text-gray-500 text-sm text-center">
                  Documents shared by teachers will appear here
                </Text>
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}
