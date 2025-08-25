// app/(tabs)/opportunities.tsx
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
import {
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
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

// Define the response type from Appwrite
interface AppwriteResponse {
  documents: Document[];
  total: number;
}

export default function OpportunitiesScreen() {
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
      const categories = [
        "Opportunities",
        "Placement",
        "Extracurricular",
        "Internships",
      ];
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.documents,
        [Query.contains("category", categories), Query.orderDesc("createdAt")],
      ); // Cast the response to our Document type
      const docs = response.documents as unknown as Document[];
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      Alert.alert("Error", "Failed to load opportunities");
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
            // For now, just log the download
            // You can implement actual download using expo-file-system
            console.log("Downloading:", document.fileUrl);
            // Example: Linking.openURL(document.fileUrl);
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading opportunities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6 border-b border-gray-800">
          <Text className="text-3xl font-bold text-white mb-2">
            Opportunities
          </Text>
          <Text className="text-gray-400">
            Discover internships, placements, and career opportunities
          </Text>
        </View>

        {/* Search and Filter Bar */}
        <View className="px-6 py-4 border-b border-gray-800">
          <View className="flex-row items-center bg-gray-900 rounded-lg px-4 py-3 mb-4">
            <Search size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-white"
              placeholder="Search opportunities..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View className="flex-row space-x-3">
            {/* Sort Button */}
            <TouchableOpacity
              className="bg-gray-900 px-4 py-2 rounded-lg flex-row items-center"
              onPress={() =>
                setSortBy(sortBy === "newest" ? "oldest" : "newest")
              }
            >
              <Text className="text-white">
                Sort: {sortBy === "newest" ? "Newest" : "Oldest"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Count */}
        <View className="px-6 py-4">
          <Text className="text-gray-400">
            {filteredDocuments.length} opportunity
            {filteredDocuments.length !== 1 ? "ies" : ""} found
          </Text>
        </View>

        {/* Documents Grid */}
        <View className="px-6 pb-6">
          {filteredDocuments.length === 0 ? (
            <View className="flex-1 justify-center items-center py-12">
              <FileText size={48} color="#6B7280" />
              <Text className="text-gray-400 text-center mt-4">
                {searchQuery
                  ? "No opportunities match your search criteria"
                  : "No opportunities available yet"}
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {filteredDocuments.map((document) => (
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
    </SafeAreaView>
  );
}
