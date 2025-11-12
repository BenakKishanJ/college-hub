// app/(tabs)/academics.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Search,
  SortAsc,
  SortDesc,
  Bell,
  User,
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "../../context/AuthContext";
import { TextInput } from "../../components/TextInput";
import { Card } from "../../components/ui/card";
import FileCard from "../../components/FileCard";

interface Document {
  $id: string;
  title: string;
  fileUrl: string;
  category: string;
  targetDepartments?: string[];
  targetSemesters?: string[];
  uploadedBy: string;
  createdAt: string;
  subjectName?: string;
  description?: string;
  fileName?: string;
  fileSize?: number;
}

export default function AcademicsScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedType, setSelectedType] = useState<"all" | "Academic" | "Exams">("all");
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set());

  const academicsIllustration = require('@/assets/images/academics.png');

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, sortBy, selectedType]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.documents,
        [
          Query.or([
            Query.equal("category", "Academic"),
            Query.equal("category", "Exams"),
          ]),
          Query.orderDesc("createdAt"),
        ],
      );

      const docs = response.documents as unknown as Document[];
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      Alert.alert("Error", "Failed to load academic materials");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((doc) => doc.category === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort documents
    filtered = filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });

    setFilteredDocuments(filtered);
  };

  const handleDownload = async (document: Document) => {
    try {
      setDownloadingDocs(prev => new Set(prev).add(document.$id));

      const canOpen = await Linking.canOpenURL(document.fileUrl);

      if (canOpen) {
        await Linking.openURL(document.fileUrl);
        Alert.alert(
          'Download Started',
          'The file download has been started in your browser.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Cannot open file URL');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed',
        'Failed to download the file. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.$id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="black" />
          <Text className="text-black mt-4 font-grotesk">Loading academic materials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Profile and Notifications */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Text className="text-2xl font-groteskBold text-black">Academics</Text>

        <View className="flex-row items-center gap-3">
          {/* Notification Icon */}
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="p-2"
          >
            <Bell size={24} color="black" />
          </TouchableOpacity>

          {/* Profile Icon */}
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            className="p-2"
          >
            <User size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero Section with Illustration */}
        <View className="px-6 pb-8 pt-0 items-center">
          <Image
            source={academicsIllustration}
            style={{ width: 350, height: 350 }}
            resizeMode="contain"
          />

          <View className="mt-8">
            <Text className="font-groteskBold text-2xl text-black text-center mb-2">
              Academic Resources
            </Text>
            <Text className="font-grotesk text-base text-neutral-500 text-center">
              Study materials, lecture notes, and exam resources
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center bg-white border-2 border-black rounded-2xl px-4 py-4">
            <Search size={20} color="#000" />
            <TextInput
              className="flex-1 ml-3 text-black font-grotesk text-base"
              placeholder="Search materials, subjects..."
              placeholderTextColor="#a3a3a3"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ color: '#000000' }}
            />
          </View>
        </View>

        {/* Filter and Sort Row */}
        <View className="px-6 mb-6 flex-row items-center justify-between">
          <View className="flex-row space-x-3">
            {(["all", "Academic", "Exams"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                className={`px-4 py-2 rounded-lg border-2 ${selectedType === type
                    ? "bg-black border-black"
                    : "bg-white border-black"
                  }`}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.8} // Consistent active opacity
              >
                <Text
                  className={`font-groteskBold text-sm ${selectedType === type ? "text-white" : "text-black"
                    }`}
                >
                  {type === "all" ? "All" : type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="bg-white border-2 border-black px-4 py-2 rounded-xl flex-row items-center"
            onPress={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
            activeOpacity={0.8} // Consistent active opacity
          >
            <Text className="text-black font-groteskBold mr-2 text-sm">
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
        <View className="px-6 mb-4 flex-row items-center justify-between">
          <Text className="text-neutral-400 font-grotesk text-sm">
            {filteredDocuments.length} item{filteredDocuments.length !== 1 ? "s" : ""} found
            {selectedType !== "all" && ` in ${selectedType}`}
          </Text>
        </View>

        {/* Documents List */}
        <View className="px-6 pb-8">
          {filteredDocuments.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20 bg-white border-2 border-black rounded-2xl">
              <Text className="text-neutral-400 text-center mt-4 font-grotesk text-base px-8">
                {searchQuery || selectedType !== "all"
                  ? "No academic materials match your search criteria"
                  : "No academic materials available yet"}
              </Text>
            </View>
          ) : (
            <View>
              {filteredDocuments.map((document) => (
                <FileCard
                  key={document.$id}
                  document={{
                    ...document,
                    fileName: document.fileName || "document",
                    fileSize: document.fileSize || 0
                  }}
                  onDownload={handleDownload}
                  isDownloading={downloadingDocs.has(document.$id)}
                  showDescription={true}
                  showFullDetails={true}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
