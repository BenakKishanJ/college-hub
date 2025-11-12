// app/(tabs)/opportunities.tsx
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
  Briefcase,
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "../../context/AuthContext";
import { TextInput } from "../../components/TextInput";
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

export default function OpportunitiesScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedType, setSelectedType] = useState<
    "all" | "Opportunities" | "Placement" | "Extracurricular" | "Internships"
  >("all");
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set());

  const opportunitiesIllustration = require('@/assets/images/opportunities.png');

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, sortBy, selectedType]);

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
        [
          Query.or(categories.map((cat) => Query.equal("category", cat))),
          Query.orderDesc("createdAt"),
        ],
      );
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

  const getFilterDisplayName = (type: string) => {
    switch (type) {
      case "all":
        return "All";
      case "Extracurricular":
        return "Extra";
      case "Internships":
        return "Internships";
      case "Placement":
        return "Placement";
      case "Opportunities":
        return "General";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="black" />
          <Text className="text-black mt-4 font-grotesk">Loading opportunities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Profile and Notifications */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Text className="text-2xl font-groteskBold text-black">Opportunities</Text>

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
        <View className="px-6 pb-0 pt-0 items-center">
          <Image
            source={opportunitiesIllustration}
            style={{ width: 350, height: 350 }}
            resizeMode="contain"
          />

          <View className="mt-0">
            <Text className="font-groteskBold text-2xl text-black text-center mb-2">
              Career Opportunities
            </Text>
            <Text className="font-grotesk text-base text-neutral-500 text-center">
              Discover internships, placements, and career opportunities
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center bg-white border-2 border-black rounded-2xl px-4 py-4">
            <Search size={20} color="#000" />
            <TextInput
              className="flex-1 ml-3 text-black font-grotesk text-base"
              placeholder="Search opportunities, companies..."
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
            {(
              [
                "all",
                "Placement",
                "Extracurricular",
                "Opportunities",
              ] as const
            ).map((type) => (
              <TouchableOpacity
                key={type}
                className={`px-4 py-2 rounded-lg border-2 ${selectedType === type
                  ? "bg-black border-black"
                  : "bg-white border-black"
                  }`}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-groteskBold text-sm ${selectedType === type ? "text-white" : "text-black"
                    }`}
                >
                  {getFilterDisplayName(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="bg-white border-2 border-black px-4 py-2 rounded-xl flex-row items-center"
            onPress={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
            activeOpacity={0.8}
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
            {filteredDocuments.length} opportunit{filteredDocuments.length !== 1 ? "ies" : "y"} found
            {selectedType !== "all" && ` in ${selectedType}`}
          </Text>
        </View>

        {/* Opportunities List */}
        <View className="px-6 pb-8">
          {filteredDocuments.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20 bg-white border-2 border-black rounded-2xl">
              <Briefcase size={56} color="#a3a3a3" />
              <Text className="text-neutral-400 text-center mt-4 font-grotesk text-base px-8">
                {searchQuery || selectedType !== "all"
                  ? "No opportunities match your search criteria"
                  : "No opportunities available yet"}
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
