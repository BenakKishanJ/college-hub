import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image as RNImage,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import {
  ChevronLeft,
  Download,
  FileText,
  Calendar,
  User,
  File,
} from "lucide-react-native";
import { File as ExpoFile, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";

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

export default function DocumentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [id]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.documents,
        id as string
      );

      const doc = response as unknown as Document;
      setDocument(doc);

      // Check if file is an image
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const fileExt = doc.fileName.toLowerCase().substring(doc.fileName.lastIndexOf('.'));
      setIsImage(imageExtensions.includes(fileExt));
    } catch (error) {
      console.error("Error loading document:", error);
      Alert.alert("Error", "Failed to load document details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    Alert.alert(
      'Download',
      `Download ${document.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => downloadFile() },
      ]
    );
  };

  const downloadFile = async () => {
    if (!document) return;

    try {
      setDownloading(true);
      Alert.alert('Downloading', `Downloading ${document.title}...`);

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = document.fileName.includes('.')
        ? document.fileName.substring(document.fileName.lastIndexOf('.'))
        : '.bin';
      const uniqueFileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}${fileExtension}`;

      // Create directory in cache
      const downloadDir = new Directory(Paths.cache, 'downloads');

      try {
        await downloadDir.create({ intermediates: true });
      } catch (dirError: any) {
        if (!dirError.message?.includes('already exists')) {
          throw dirError;
        }
      }

      // Use the static downloadFileAsync method - it will use the filename from the URL
      // but we can rename it after download
      const downloadResult = await ExpoFile.downloadFileAsync(document.fileUrl, downloadDir);

      if (downloadResult && downloadResult.exists) {
        // Get the downloaded file name (might be from URL)
        const downloadedFileName = downloadResult.uri.split('/').pop();

        // If we want a specific name, we need to move/rename the file
        if (downloadedFileName !== uniqueFileName) {
          const newFile = new ExpoFile(downloadDir, uniqueFileName);
          await downloadResult.move(newFile);

          // Use the new file for sharing
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(newFile.uri);
          } else {
            Alert.alert('Download Complete', `File saved as: ${uniqueFileName}`);
          }
        } else {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadResult.uri);
          } else {
            Alert.alert('Download Complete', 'File downloaded successfully!');
          }
        }
      } else {
        throw new Error('Download failed');
      }

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download',
        'Would you like to download the file in your browser instead?',
        [
          {
            text: 'Open in Browser',
            onPress: () => Linking.openURL(document!.fileUrl)
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setDownloading(false);
    }
  };

  // Simple browser download method as reliable fallback
  const downloadFileSimple = async () => {
    if (!document) return;

    try {
      setDownloading(true);

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
        'Failed to start download. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-black mt-4 font-grotesk">Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!document) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-black font-grotesk">Document not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-black px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-groteskBold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Back Button */}
      <View className="px-6 py-4 flex-row items-center border-b-2 border-black">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 mr-4"
        >
          <ChevronLeft size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-groteskBold text-black flex-1" numberOfLines={1}>
          Document Details
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Document Image/Icon */}
        <View className="px-6 py-8 items-center">
          {isImage ? (
            <RNImage
              source={{ uri: document.fileUrl }}
              className="w-full h-80 rounded-2xl border-2 border-black"
              resizeMode="contain"
            />
          ) : (
            <View className="w-48 h-48 bg-white border-2 border-black rounded-2xl items-center justify-center">
              <FileText size={64} color="#000" />
            </View>
          )}
        </View>

        {/* Document Details */}
        <View className="px-6">
          {/* Title */}
          <Text className="text-2xl font-groteskBold text-black mb-4">
            {document.title}
          </Text>

          {/* Description */}
          {document.description && (
            <View className="mb-6">
              <Text className="text-lg font-groteskBold text-black mb-2">
                Description
              </Text>
              <Text className="text-neutral-600 font-grotesk text-base leading-6">
                {document.description}
              </Text>
            </View>
          )}

          {/* File Details Card */}
          <View className="bg-white border-2 border-black rounded-2xl p-5 mb-6">
            <Text className="text-lg font-groteskBold text-black mb-4">
              File Details
            </Text>

            {/* File Name */}
            <View className="flex-row items-center mb-4">
              <File size={20} color="#000" />
              <View className="ml-3 flex-1">
                <Text className="text-neutral-500 text-sm font-grotesk">File Name</Text>
                <Text className="text-black font-grotesk text-base" numberOfLines={1}>
                  {document.fileName}
                </Text>
              </View>
            </View>

            {/* File Size */}
            <View className="flex-row items-center mb-4">
              <FileText size={20} color="#000" />
              <View className="ml-3">
                <Text className="text-neutral-500 text-sm font-grotesk">File Size</Text>
                <Text className="text-black font-grotesk text-base">
                  {formatFileSize(document.fileSize)}
                </Text>
              </View>
            </View>

            {/* Upload Date */}
            <View className="flex-row items-center mb-4">
              <Calendar size={20} color="#000" />
              <View className="ml-3">
                <Text className="text-neutral-500 text-sm font-grotesk">Upload Date</Text>
                <Text className="text-black font-grotesk text-base">
                  {formatDate(document.createdAt)}
                </Text>
              </View>
            </View>

            {/* Category */}
            <View className="flex-row items-center mb-4">
              <FileText size={20} color="#000" />
              <View className="ml-3">
                <Text className="text-neutral-500 text-sm font-grotesk">Category</Text>
                <Text className="text-black font-grotesk text-base">
                  {document.category}
                </Text>
              </View>
            </View>

            {/* Uploaded By */}
            <View className="flex-row items-center">
              <User size={20} color="#000" />
              <View className="ml-3">
                <Text className="text-neutral-500 text-sm font-grotesk">Uploaded By</Text>
                <Text className="text-black font-grotesk text-base">
                  {document.uploadedBy}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Download Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black px-6 py-4">
        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloading}
          className={`${downloading ? 'bg-neutral-200' : 'bg-black'
            } py-4 rounded-xl flex-row items-center justify-center`}
        >
          {downloading ? (
            <Text className="text-black font-groteskBold text-lg">Downloading...</Text>
          ) : (
            <>
              <Download size={24} color="white" />
              <Text className="text-white font-groteskBold text-lg ml-2">
                Download File
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Simple download alternative */}
        <TouchableOpacity
          onPress={downloadFileSimple}
          disabled={downloading}
          className="mt-3 py-3 rounded-xl border-2 border-black flex-row items-center justify-center"
        >
          <Text className="text-black font-groteskBold text-base">
            Quick Download (Browser)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
