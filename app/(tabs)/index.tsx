// app/(tabs)/index.tsx (fixed Text component issues)
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Bell,
  Download,
  FileText,
  Calendar,
  Megaphone,
  BookOpen,
  Laptop,
  Briefcase,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "../../context/AuthContext";
import TeacherFAB from "../../components/TeacherFAB";
import { Card } from "@/components/ui/card";
import { TextInput } from "../../components/TextInput";

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
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, sortBy]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.documents,
        [
          Query.equal("category", "General Circulars"),
          Query.orderDesc("createdAt"),
          Query.limit(20),
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

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort documents
    filtered = filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });

    setFilteredDocuments(filtered);
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

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Welcome Section */}
        <View className="px-6 py-8">
          <Text className="font-groteskBold text-2xl text-neutral-500">
            Hi{" "}
            <Text
              onPress={() => router.push("/profile")}
              className="text-black font-groteskBold text-2xl"
            >
              {user?.displayName?.toString().toUpperCase() || "Student"}
            </Text>
            ! Don't miss out on the latest campus happenings.
          </Text>
          <Text className="font-groteskBold text-black mt-10 text-2xl">
            Here are the latest general circulars for you.
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 shadow-sm border border-neutral-300">
            <Search size={20} color="#a3a3a3" />
            <TextInput
              className="flex-1 ml-3 text-black font-grotesk text-base"
              placeholder="Search circulars, announcements..."
              placeholderTextColor="#a3a3a3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Sort Row */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            className="bg-white border border-neutral-300 px-4 py-3 rounded-2xl flex-row items-center justify-between w-40"
            onPress={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
          >
            <Text className="text-black font-grotesk">
              {sortBy === "newest" ? "Newest" : "Oldest"}
            </Text>
            {sortBy === "newest" ? (
              <SortDesc size={16} color="#000" />
            ) : (
              <SortAsc size={16} color="#000" />
            )}
          </TouchableOpacity>
        </View>

        {/* Results Count */}
        <View className="px-6 mb-4">
          <Text className="text-neutral-400 font-grotesk">
            {filteredDocuments.length} circular
            {filteredDocuments.length !== 1 ? "s" : ""} found
            {searchQuery && ` for "${searchQuery}"`}
          </Text>
        </View>

        {/* General Circulars Section */}
        <View className="px-6 pb-8">
          {filteredDocuments.length === 0 ? (
            <View className="flex-1 justify-center items-center py-16 bg-white rounded-2xl border border-neutral-300">
              <Megaphone size={48} color="#a3a3a3" />
              <Text className="text-neutral-400 text-center mt-4 font-grotesk text-base px-8">
                {searchQuery
                  ? "No circulars match your search criteria"
                  : "No circulars available yet"}
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {filteredDocuments.map((document) => (
                <Card
                  key={document.$id}
                  className="bg-white rounded-2xl p-6 border border-neutral-300 shadow-sm"
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 pr-4">
                      {/* Category Badge */}
                      <View className="flex-row items-center mb-3">
                        <View className="flex-row items-center bg-neutral-200 px-3 py-1 rounded-full">
                          <Megaphone size={16} color="#a3a3a3" />
                          <Text className="text-neutral-400 text-sm ml-2 font-grotesk">
                            General Circular
                          </Text>
                        </View>
                      </View>

                      {/* Title */}
                      <Text className="text-black font-groteskBold text-lg mb-2 leading-6">
                        {document.title}
                      </Text>

                      {/* Description */}
                      {document.description && (
                        <Text className="text-neutral-400 text-sm mb-3 font-grotesk leading-5">
                          {document.description}
                        </Text>
                      )}
                    </View>

                    {/* Download Button */}
                    <TouchableOpacity
                      onPress={() => handleDownload(document)}
                      className="bg-lime-400 p-3 rounded-full"
                    >
                      <Download size={20} color="black" />
                    </TouchableOpacity>
                  </View>

                  {/* File Info and Date */}
                  <View className="flex-row justify-between items-center pt-4 border-t border-neutral-200">
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <FileText size={14} color="#a3a3a3" />
                        <Text className="text-neutral-400 text-sm ml-1 font-grotesk">
                          {document.fileName}
                        </Text>
                      </View>
                      <Text className="text-neutral-400 text-sm font-grotesk">
                        {formatFileSize(document.fileSize)}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Calendar size={14} color="#a3a3a3" />
                      <Text className="text-neutral-400 text-sm ml-1 font-grotesk">
                        {formatDate(document.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Text features line */}
        <View className="px-6 py-8">
          <View className="flex-wrap flex-row items-center">
            <Text className="text-neutral-500 font-groteskBold text-2xl">
              From essential{" "}
            </Text>

            {/* Exam rules and notices */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/academics")}
              className="flex-row items-center mr-1"
            >
              <View className="p-2 bg-black rounded-full mr-1">
                <BookOpen size={20} color="white" />
              </View>
              <Text className="text-black font-groteskBold text-2xl">exam</Text>
            </TouchableOpacity>

            <Text className="text-neutral-500 font-groteskBold text-2xl">
              {" "}
              rules and notices to updates across your{" "}
            </Text>

            {/* Branch */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/department")}
              className="flex-row items-center mr-1"
            >
              <View className="p-2 bg-black rounded-full mr-1">
                <Laptop size={20} color="white" />
              </View>
              <Text className="text-black font-groteskBold text-2xl">
                {user?.department?.toString().toLowerCase() || "branch"}
              </Text>
            </TouchableOpacity>

            <Text className="text-neutral-500 font-groteskBold text-2xl">
              {" "}
              department and from{" "}
            </Text>
            <Text className="text-neutral-500 font-groteskBold text-2xl">
              {" "}
              exciting{" "}
            </Text>

            {/* Opportunities */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/opportunities")}
              className="mr-1"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-black rounded-full mr-1">
                  <Briefcase size={20} color="white" />
                </View>
                <Text className="text-black font-groteskBold text-2xl">
                  activities
                </Text>
              </View>
            </TouchableOpacity>

            <Text className="text-neutral-500 font-groteskBold text-2xl">
              {" "}
              to career-shaping experiences, this app keeps you informed,
              connected, and ahead.
            </Text>
          </View>
        </View>
      </ScrollView>
      <TeacherFAB />
    </SafeAreaView>
  );
}
