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
  BookOpen,
  Laptop,
  Briefcase,
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
      <View className="w-12 h-12 bg-neutral-950 rounded-full items-center justify-center">
        <Text className="font-groteskBold text-white text-3xl">
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
    <SafeAreaView className="flex-1 bg-neutral-200">
      {/* Header */}
      <View className="px-6 py-4 border-black">
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
            className="p-2 bg-neutral-950 rounded-full"
          >
            <Bell size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView className="flex-1">
        {/* Welcome Section */}
        <View className="px-6 py-8">
          <Text className="font-groteskBold text-4xl text-neutral-500">
            Hi{" "}
            <Text className="text-black font-groteskBold">
              {user?.displayName?.toString().toUpperCase() || "Student"}
            </Text>
            ! Let's get started with your college updates.
          </Text>
          {/* Text features line */}
          <View className="flex-wrap flex-row mt-10">
            {/* Normal text */}
            <Text className="text-neutral-500 font-groteskBold text-4xl">
              Explore{" "}
            </Text>

            {/* Academics */}
            <View className="flex-row items-center mr-2">
              <View className="p-2 bg-black rounded-full mr-1">
                <BookOpen size={20} color="white" />
              </View>
              <Text className="text-black font-groteskBold text-4xl">
                Academics
              </Text>
            </View>
            <Text className="text-neutral-500 font-groteskBold text-4xl">
              ,
            </Text>
            <Text className="text-neutral-500 font-groteskBold text-4xl">
              dive into{" "}
            </Text>

            {/* Computer Science */}
            <View className="flex-row items-center mr-2">
              <View className="p-2 bg-black rounded-full mr-1">
                <Laptop size={20} color="white" />
              </View>
              <Text className="text-black font-groteskBold text-4xl">
                Department
              </Text>
            </View>

            <Text className="text-neutral-500 font-groteskBold text-4xl">
              ,
            </Text>
            <Text className="text-neutral-500 font-groteskBold text-4xl">
              or you can discover new{" "}
            </Text>

            {/* Opportunities */}
            <View className="flex-row items-center mr-2">
              <View className="p-2 bg-black rounded-full mr-1">
                <Briefcase size={20} color="white" />
              </View>
              <Text className="text-black font-groteskBold text-4xl">
                Opportunities
              </Text>
            </View>

            <Text className="text-neutral-500 font-groteskBold text-4xl">
              waiting
            </Text>
            <Text className="text-neutral-500 font-groteskBold text-4xl">
              for you.
            </Text>
          </View>
          <Text className="font-groteskBold text-neutral-500 mt-10 text-4xl">
            Here are the latest general circulars for you.
          </Text>
        </View>
        {/* General Circulars Section */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="font-groteskBold text-2xl text-black">
              General Circulars
            </Text>
            <View className="flex-row items-center">
              <View className="p-2 bg-neutral-950 rounded-full">
                <Megaphone size={20} color="white" className="mr-2" />
              </View>
              <Text className="font-groteskBold text-neutral-500 ml-2 text-2xl">
                {documents.length} circular{documents.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {documents.length === 0 ? (
            <View className="flex-1 justify-center items-center py-12">
              <FileText size={48} color="#737373" />
              <Text className="font-grotesk text-neutral-500 text-center mt-4 text-xl">
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
      </ScrollView>
      <TeacherFAB />
    </SafeAreaView>
  );
}
