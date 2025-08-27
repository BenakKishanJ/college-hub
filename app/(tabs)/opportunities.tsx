// app/(tabs)/opportunities.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Button, ButtonText } from "@/components/ui/button";

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
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});

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


  // Main download handler function
  const handleDownload = async (document: Document) => {
    try {
      // Request media library permissions for saving to device
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library permissions to download files.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Download',
        `Download ${document.title}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Download',
            onPress: () => downloadFile(document),
          },
        ]
      );
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  // Core download function
  const downloadFile = async (document: Document) => {
    try {
      // Create a unique filename with timestamp to avoid conflicts
      const timestamp = new Date().getTime();
      const fileExtension = getFileExtension(document.fileName ?? '');
      const fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}${fileExtension}`;

      // Define download path
      const downloadPath = `${FileSystem.documentDirectory}${fileName}`;

      // Show loading alert
      Alert.alert('Downloading', `Downloading ${document.title}...`);

      // Create download resumable for better control and progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        document.fileUrl,
        downloadPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(prev => ({
            ...prev,
            [document.$id]: Math.round(progress * 100)
          }));
        }
      );

      // Start download
      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        // Clear progress
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[document.$id];
          return newProgress;
        });

        // Handle successful download
        await handleDownloadSuccess(result.uri, document, fileName);
      } else {
        throw new Error('Download failed - no result URI');
      }

    } catch (error) {
      // Clear progress on error
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[document.$id];
        return newProgress;
      });

      console.error('Download error:', error);
      Alert.alert(
        'Download Failed',
        'Failed to download the file. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle successful download
  const handleDownloadSuccess = async (fileUri: string, document: Document, fileName: string) => {
    try {
      if (Platform.OS === 'ios') {
        // On iOS, use sharing
        if (await Sharing.isAvailableAsync()) {
          Alert.alert(
            'Download Complete',
            `${document.title} has been downloaded successfully!`,
            [
              {
                text: 'Share',
                onPress: () => Sharing.shareAsync(fileUri),
              },
              {
                text: 'OK',
                style: 'default',
              },
            ]
          );
        } else {
          Alert.alert('Download Complete', `File saved to: ${fileName}`);
        }
      } else {
        // On Android, save to media library and offer sharing
        try {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);

          Alert.alert(
            'Download Complete',
            `${document.title} has been saved to your device!`,
            [
              {
                text: 'Share',
                onPress: () => Sharing.shareAsync(fileUri),
              },
              {
                text: 'OK',
                style: 'default',
              },
            ]
          );
        } catch (mediaError) {
          console.error('Media library error:', mediaError);
          // Fallback to sharing if media library fails
          if (await Sharing.isAvailableAsync()) {
            Alert.alert(
              'Download Complete',
              'File downloaded! You can share it now.',
              [
                {
                  text: 'Share',
                  onPress: () => Sharing.shareAsync(fileUri),
                },
                {
                  text: 'OK',
                  style: 'default',
                },
              ]
            );
          } else {
            Alert.alert('Download Complete', 'File has been downloaded successfully!');
          }
        }
      }
    } catch (error) {
      console.error('Post-download handling error:', error);
      Alert.alert('Download Complete', 'File downloaded, but sharing is not available.');
    }
  };

  // Helper function to extract file extension
  const getFileExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  };

  // Optional: Function to check available storage space
  const checkStorageSpace = async (): Promise<boolean> => {
    try {
      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      // Check if there's at least 50MB free space
      return freeDiskStorage > 50 * 1024 * 1024;
    } catch (error) {
      console.error('Storage check error:', error);
      return true; // Assume there's space if we can't check
    }
  };

  // Enhanced download with storage check
  const downloadFileWithStorageCheck = async (document: Document) => {
    const hasSpace = await checkStorageSpace();

    if (!hasSpace) {
      Alert.alert(
        'Insufficient Storage',
        'Not enough storage space available. Please free up some space and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    await downloadFile(document);
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

  // Enhanced renderDocumentCard with download progress
  const renderDocumentCard = (item: Document, isCompact: boolean = false) => {
    const progress = downloadProgress[item.$id];
    const isDownloading = progress !== undefined;

    return (
      <Card key={item.$id} className="bg-white border border-neutral-200 mb-3 p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className={`text-black ${isCompact ? 'text-base font-grotesk' : 'text-lg font-groteskBold'} mb-1`}>
              {item.title}
            </Text>
            {item.description && (
              <Text className="text-neutral-400 text-sm font-grotesk mb-2">
                {item.description}
              </Text>
            )}

            {/* Download Progress Bar */}
            {isDownloading && (
              <View className="mt-2">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-lime-400 text-xs font-grotesk">
                    Downloading...
                  </Text>
                  <Text className="text-lime-400 text-xs font-groteskBold">
                    {progress}%
                  </Text>
                </View>
                <View className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-lime-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </View>
              </View>
            )}
          </View>

          <Button
            onPress={() => isDownloading ? null : handleDownload(item)}
            className={`${isDownloading ? 'bg-neutral-300' : 'bg-lime-400'} p-3 rounded-lg min-w-0`}
            disabled={isDownloading}
          >
            <ButtonText>
              {isDownloading ? (
                <ActivityIndicator size={18} color="#a3a3a3" />
              ) : (
                <Download size={18} color="black" />
              )}
            </ButtonText>
          </Button>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <FileText size={12} color="#a3a3a3" />
              <Text className="text-neutral-400 text-xs font-grotesk ml-1 flex-1" numberOfLines={1}>
                {item.fileName}
              </Text>
            </View>
            <Text className="text-neutral-400 text-xs font-grotesk">
              {formatFileSize(item.fileSize)}
            </Text>
          </View>

          <View className="items-end">
            <View className="flex-row items-center">
              <Calendar size={12} color="#a3a3a3" />
              <Text className="text-neutral-400 text-xs font-grotesk ml-1">
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
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
                renderDocumentCard(document)))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
