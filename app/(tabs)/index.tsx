// app/(tabs)/index.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Linking
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
  User,
} from "lucide-react-native";
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "../../context/AuthContext";
import TeacherFAB from "../../components/TeacherFAB";
import { Card } from "@/components/ui/card";
import { TextInput } from "../../components/TextInput";
import { Button, ButtonText } from "@/components/ui/button"
import FileCard from "../../components/FileCard";

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
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set());
  const homeIllustration = require('@/assets/images/home.png');

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

    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

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
  const downloadFile = async (document: Document) => {
    try {
      const timestamp = new Date().getTime();
      const fileExtension = getFileExtension(document.fileName);
      const fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}${fileExtension}`;

      Alert.alert('Downloading', `Downloading ${document.title}...`);

      const downloadedFile = await File.downloadFileAsync(
        document.fileUrl,
        Paths.document
      );

      if (downloadedFile && downloadedFile.exists) {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[document.$id];
          return newProgress;
        });

        await handleDownloadSuccess(downloadedFile.uri, document, fileName);
      } else {
        throw new Error('Download failed - file does not exist');
      }
    } catch (error) {
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

  const handleDownloadSuccess = async (fileUri: string, document: Document, fileName: string) => {
    try {
      if (Platform.OS === 'ios') {
        if (await Sharing.isAvailableAsync()) {
          Alert.alert(
            'Download Complete',
            `${document.title} has been downloaded successfully!`,
            [
              { text: 'Share', onPress: () => Sharing.shareAsync(fileUri) },
              { text: 'OK', style: 'default' },
            ]
          );
        } else {
          Alert.alert('Download Complete', `File saved to: ${fileName}`);
        }
      } else {
        try {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);

          Alert.alert(
            'Download Complete',
            `${document.title} has been saved to your device!`,
            [
              { text: 'Share', onPress: () => Sharing.shareAsync(fileUri) },
              { text: 'OK', style: 'default' },
            ]
          );
        } catch (mediaError) {
          console.error('Media library error:', mediaError);
          if (await Sharing.isAvailableAsync()) {
            Alert.alert(
              'Download Complete',
              'File downloaded! You can share it now.',
              [
                { text: 'Share', onPress: () => Sharing.shareAsync(fileUri) },
                { text: 'OK', style: 'default' },
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

  const getFileExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
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

  const renderDocumentCard = (item: Document) => (
    <FileCard
      key={item.$id}
      document={item}
      onDownload={handleDownload}
      isDownloading={downloadingDocs.has(item.$id)}
      showDescription={true}
      showFullDetails={true}
    />
  );
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="black" />
          <Text className="text-black mt-4 font-grotesk">Loading circulars...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Profile and Notifications */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Text className="text-2xl font-groteskBold text-black">AITian</Text>

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
            source={homeIllustration}
            style={{ width: 350, height: 350 }}
            resizeMode="contain"
          />

          <View className="mt-8">
            <Text className="font-groteskBold text-2xl text-black text-center mb-2">
              Hi {user?.displayName?.toString().toUpperCase() || "Student"}!
            </Text>
            <Text className="font-grotesk text-base text-neutral-500 text-center">
              Don't miss out on the latest campus happenings
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center bg-white border-2 border-black rounded-2xl px-4 py-4">
            <Search size={20} color="#000" />
            <TextInput
              className="flex-1 ml-3 text-black font-grotesk text-base"
              placeholder="Search circulars, announcements..."
              placeholderTextColor="#a3a3a3"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ color: '#000000' }}
            />
          </View>
        </View>

        {/* Sort and Results Row */}
        <View className="px-6 mb-6 flex-row items-center justify-between">
          <TouchableOpacity
            className="bg-white border-2 border-black px-5 py-3 rounded-xl flex-row items-center"
            onPress={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
            activeOpacity={0.8} // Add this line to fix the greyed out state
          >
            <Text className="text-black font-groteskBold mr-2">
              {sortBy === "newest" ? "Newest" : "Oldest"}
            </Text>
            {sortBy === "newest" ? (
              <SortDesc size={18} color="#000" />
            ) : (
              <SortAsc size={18} color="#000" />
            )}
          </TouchableOpacity>

          <Text className="text-neutral-400 font-grotesk text-sm">
            {filteredDocuments.length} circular{filteredDocuments.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Circulars List */}
        <View className="px-6 pb-8">
          {filteredDocuments.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20 bg-white border-2 border-black rounded-2xl">
              <Megaphone size={56} color="#a3a3a3" />
              <Text className="text-neutral-400 text-center mt-4 font-grotesk text-base px-8">
                {searchQuery
                  ? "No circulars match your search"
                  : "No circulars available yet"}
              </Text>
            </View>
          ) : (
            <View>
              {filteredDocuments.map((document) => renderDocumentCard(document))}
            </View>
          )}
        </View>

        {/* Features Section */}
        {/* <View className="px-6 py-8 bg-neutral-50"> */}
        {/*   <View className="flex-wrap flex-row items-center"> */}
        {/*     <Text className="text-neutral-500 font-groteskBold text-xl leading-7"> */}
        {/*       From essential{" "} */}
        {/*     </Text> */}
        {/**/}
        {/*     <TouchableOpacity */}
        {/*       onPress={() => router.push("/(tabs)/academics")} */}
        {/*       className="flex-row items-center mx-1" */}
        {/*     > */}
        {/*       <View className="p-2 bg-black rounded-full mr-1"> */}
        {/*         <BookOpen size={18} color="white" /> */}
        {/*       </View> */}
        {/*       <Text className="text-black font-groteskBold text-xl">exam</Text> */}
        {/*     </TouchableOpacity> */}
        {/**/}
        {/*     <Text className="text-neutral-500 font-groteskBold text-xl leading-7"> */}
        {/*       {" "}rules and notices to updates across your{" "} */}
        {/*     </Text> */}
        {/**/}
        {/*     <TouchableOpacity */}
        {/*       onPress={() => router.push("/(tabs)/department")} */}
        {/*       className="flex-row items-center mx-1" */}
        {/*     > */}
        {/*       <View className="p-2 bg-black rounded-full mr-1"> */}
        {/*         <Laptop size={18} color="white" /> */}
        {/*       </View> */}
        {/*       <Text className="text-black font-groteskBold text-xl"> */}
        {/*         {user?.department?.toString().toLowerCase() || "branch"} */}
        {/*       </Text> */}
        {/*     </TouchableOpacity> */}
        {/**/}
        {/*     <Text className="text-neutral-500 font-groteskBold text-xl leading-7"> */}
        {/*       {" "}department and exciting{" "} */}
        {/*     </Text> */}
        {/**/}
        {/*     <TouchableOpacity */}
        {/*       onPress={() => router.push("/(tabs)/opportunities")} */}
        {/*       className="flex-row items-center mx-1" */}
        {/*     > */}
        {/*       <View className="p-2 bg-black rounded-full mr-1"> */}
        {/*         <Briefcase size={18} color="white" /> */}
        {/*       </View> */}
        {/*       <Text className="text-black font-groteskBold text-xl"> */}
        {/*         activities */}
        {/*       </Text> */}
        {/*     </TouchableOpacity> */}
        {/**/}
        {/*     <Text className="text-neutral-500 font-groteskBold text-xl leading-7"> */}
        {/*       {" "}to career-shaping experiences, this app keeps you informed and ahead. */}
        {/*     </Text> */}
        {/*   </View> */}
        {/* </View> */}
      </ScrollView>

      <TeacherFAB />
    </SafeAreaView>
  );
}
