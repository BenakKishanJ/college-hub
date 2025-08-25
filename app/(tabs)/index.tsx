// app/(tabs)/index.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import {
  Bell,
  User,
  Download,
  FileText,
  Calendar,
  Megaphone,
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "../../context/AuthContext";
import TeacherFAB from "../../components/TeacherFAB";

interface Document {
  $id: string;
  title: string;
  fileUrl: string;
  category: string;
  description?: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.documents,
        [
          Query.equal("category", "General Circulars"),
          Query.orderDesc("createdAt"),
          Query.limit(10), // Show latest 10 circulars
        ],
      );

      const docs = response.documents as unknown as Document[];
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      Alert.alert("Error", "Failed to load circulars");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      Alert.alert("Download", `Would you like to download ${document.title}?`, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Download",
          onPress: () => {
            console.log("Downloading:", document.fileUrl);
          },
        },
      ]);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download file");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserAvatar = () => {
    // You can replace this with actual user avatar logic
    return (
      <View className="w-10 h-10 bg-gray-700 rounded-full items-center justify-center">
        <Text className="text-white font-semibold text-lg">
          {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading circulars...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          {/* User Avatar */}
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            className="flex-row items-center"
          >
            {getUserAvatar()}
          </TouchableOpacity>

          {/* Notifications Bell */}
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="p-2"
          >
            <Bell size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Welcome Section */}
        <View className="px-6 py-8">
          <Text className="text-2xl font-light text-white mb-1">
            Welcome back,
          </Text>
          <Text className="text-3xl font-bold text-white">
            {user?.displayName || "Student"}!
          </Text>
          <Text className="text-gray-400 mt-2">
            Here are the latest general circulars for you.
          </Text>
        </View>

        {/* General Circulars Section */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-white">
              General Circulars
            </Text>
            <View className="flex-row items-center">
              <Megaphone size={20} color="#6B7280" className="mr-2" />
              <Text className="text-gray-400">
                {documents.length} circular{documents.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {documents.length === 0 ? (
            <View className="flex-1 justify-center items-center py-12">
              <FileText size={48} color="#6B7280" />
              <Text className="text-gray-400 text-center mt-4">
                No general circulars available yet
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {documents.map((document) => (
                <View
                  key={document.$id}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-lg mb-1">
                        {document.title}
                      </Text>
                      {document.description && (
                        <Text className="text-gray-400 text-sm mb-2">
                          {document.description}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDownload(document)}
                      className="bg-white p-2 rounded-lg"
                    >
                      <Download size={20} color="black" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <FileText size={14} color="#6B7280" />
                        <Text className="text-gray-400 text-sm ml-1">
                          {document.fileName}
                        </Text>
                      </View>
                      <Text className="text-gray-400 text-sm">
                        {formatFileSize(document.fileSize)}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Calendar size={14} color="#6B7280" />
                      <Text className="text-gray-400 text-sm ml-1">
                        {formatDate(document.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions Section */}
        <View className="px-6 pb-8">
          <Text className="text-2xl font-bold text-white mb-6">
            Quick Access
          </Text>
          <View className="flex-row flex-wrap gap-4">
            <TouchableOpacity
              onPress={() => router.push("/academics")}
              className="bg-gray-900 px-6 py-4 rounded-lg border border-gray-800 flex-1 min-w-[150px]"
            >
              <Text className="text-white font-semibold text-center mb-2">
                📚 Academics
              </Text>
              <Text className="text-gray-400 text-xs text-center">
                Study materials & exams
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/department")}
              className="bg-gray-900 px-6 py-4 rounded-lg border border-gray-800 flex-1 min-w-[150px]"
            >
              <Text className="text-white font-semibold text-center mb-2">
                🏛️ Department
              </Text>
              <Text className="text-gray-400 text-xs text-center">
                Circulars & subjects
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/opportunities")}
              className="bg-gray-900 px-6 py-4 rounded-lg border border-gray-800 flex-1 min-w-[150px]"
            >
              <Text className="text-white font-semibold text-center mb-2">
                💼 Opportunities
              </Text>
              <Text className="text-gray-400 text-xs text-center">
                Internships & jobs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <TeacherFAB />
    </SafeAreaView>
  );
}
