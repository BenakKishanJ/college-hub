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
  Download,
  FileText,
  Calendar,
  Briefcase,
  Users,
  Trophy,
  GraduationCap,
  SortAsc,
  SortDesc,
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { TextInput } from "../../components/TextInput";
import { Card } from "@/components/ui/card";

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedType, setSelectedType] = useState<
    "all" | "Opportunities" | "Placement" | "Extracurricular" | "Internships"
  >("all");

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
            // Implement actual download logic here
          },
        },
      ]);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download file");
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "Unknown size";
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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "placement":
        return <Briefcase size={16} color="#a3a3a3" />;
      case "internships":
        return <GraduationCap size={16} color="#a3a3a3" />;
      case "extracurricular":
        return <Trophy size={16} color="#a3a3a3" />;
      case "opportunities":
        return <Users size={16} color="#a3a3a3" />;
      default:
        return <FileText size={16} color="#a3a3a3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "placement":
        return "bg-green-100 text-green-800";
      case "internships":
        return "bg-blue-100 text-blue-800";
      case "extracurricular":
        return "bg-purple-100 text-purple-800";
      case "opportunities":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <SafeAreaView className="flex-1 bg-neutral-200">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#a3e635" />
          <Text className="text-black mt-4 font-grotesk">
            Loading opportunities...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-200">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }} // Add this line
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-groteskBold text-black mb-2">
            Opportunities
          </Text>
          <Text className="text-neutral-400 font-grotesk text-base">
            Discover internships, placements, and career opportunities
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 shadow-sm border border-neutral-300">
            <Search size={20} color="#a3a3a3" />
            <TextInput
              className="flex-1 ml-3 text-black font-grotesk text-base"
              placeholder="Search opportunities, companies..."
              placeholderTextColor="#a3a3a3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter and Sort Row */}
        <View className="px-6 mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row space-x-3">
              {/* Category Filter Buttons */}
              {(
                [
                  "all",
                  "Placement",
                  "Internships",
                  "Extracurricular",
                  "Opportunities",
                ] as const
              ).map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`px-6 py-3 rounded-full border ${selectedType === type
                      ? "bg-lime-400 border-lime-400"
                      : "bg-white border-neutral-300"
                    }`}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    className={`font-grotesk font-medium ${selectedType === type ? "text-black" : "text-neutral-400"
                      }`}
                  >
                    {getFilterDisplayName(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Sort Button */}
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
            {filteredDocuments.length} opportunit
            {filteredDocuments.length !== 1 ? "ies" : "y"} found
            {selectedType !== "all" && ` in ${selectedType}`}
          </Text>
        </View>

        {/* Opportunities List */}
        <View className="px-6 pb-6">
          {filteredDocuments.length === 0 ? (
            <View className="flex-1 justify-center items-center py-16 bg-white rounded-2xl border border-neutral-300">
              <Briefcase size={48} color="#a3a3a3" />
              <Text className="text-neutral-400 text-center mt-4 font-grotesk text-base px-8">
                {searchQuery || selectedType !== "all"
                  ? "No opportunities match your search criteria"
                  : "No opportunities available yet"}
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
                          {getCategoryIcon(document.category)}
                          <Text className="text-neutral-400 text-sm ml-2 font-grotesk">
                            {document.category}
                          </Text>
                        </View>
                        {document.subjectName && (
                          <View className="bg-lime-400 px-3 py-1 rounded-full ml-2">
                            <Text className="text-black text-xs font-grotesk font-medium">
                              {document.subjectName}
                            </Text>
                          </View>
                        )}
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

                      {/* Department and Semester Tags */}
                      {(document.targetDepartments ||
                        document.targetSemesters) && (
                          <View className="flex-row flex-wrap mb-3">
                            {document.targetDepartments?.map((dept, index) => (
                              <View
                                key={`dept-${index}`}
                                className="bg-blue-100 px-2 py-1 rounded-lg mr-2 mb-1"
                              >
                                <Text className="text-blue-800 text-xs font-grotesk">
                                  {dept}
                                </Text>
                              </View>
                            ))}
                            {document.targetSemesters?.map((sem, index) => (
                              <View
                                key={`sem-${index}`}
                                className="bg-purple-100 px-2 py-1 rounded-lg mr-2 mb-1"
                              >
                                <Text className="text-purple-800 text-xs font-grotesk">
                                  Sem {sem}
                                </Text>
                              </View>
                            ))}
                          </View>
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
                          {document.fileName || "Document"}
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
      </ScrollView>
    </SafeAreaView>
  );
}
