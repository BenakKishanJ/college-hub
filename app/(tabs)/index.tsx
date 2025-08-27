// app/(tabs)/index.tsx (fixed Text component issues)
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "../../context/AuthContext";
import TeacherFAB from "../../components/TeacherFAB";
import { Card } from "@/components/ui/card";
import { TextInput } from "../../components/TextInput";
import { Button, ButtonText } from "@/components/ui/button"

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
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});

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
      const fileExtension = getFileExtension(document.fileName);
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
                renderDocumentCard(document)))}
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
