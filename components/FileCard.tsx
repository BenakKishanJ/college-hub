import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Download, FileText, Calendar } from "lucide-react-native";
import { Card } from "@/components/ui/card";

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

interface FileCardProps {
  document: Document;
  onDownload?: (document: Document) => void;
  isDownloading?: boolean;
  showDescription?: boolean;
  showFullDetails?: boolean;
}

export default function FileCard({
  document,
  onDownload,
  isDownloading = false,
  showDescription = true,
  showFullDetails = true
}: FileCardProps) {

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(document);
    } else {
      // Default download behavior if no custom handler provided
      Alert.alert(
        'Download',
        `Download ${document.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: () => downloadFileInBrowser(document)
          },
        ]
      );
    }
  };

  const downloadFileInBrowser = async (doc: Document) => {
    try {
      const canOpen = await Linking.canOpenURL(doc.fileUrl);
      if (canOpen) {
        await Linking.openURL(doc.fileUrl);
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
        'Failed to start download. Please try again.',
        [{ text: 'OK' }]
      );
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

  return (
    <TouchableOpacity
      onPress={() => router.push(`/document/${document.$id}`)}
      activeOpacity={0.7}
    >
      <Card className="bg-white border-2 border-black mb-4 p-5">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-black text-lg font-groteskBold mb-2">
              {document.title}
            </Text>
            {showDescription && document.description && (
              <Text className="text-neutral-500 text-sm font-grotesk mb-2">
                {document.description}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Prevent navigation when download is pressed
              handleDownload();
            }}
            className={`${isDownloading ? 'bg-neutral-200' : 'bg-black'} p-3 rounded-lg`}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size={20} color="#000" />
            ) : (
              <Download size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {showFullDetails && (
          <View className="flex-row justify-between items-center pt-3 border-t border-neutral-200">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <FileText size={14} color="#737373" />
                <Text className="text-neutral-500 text-xs font-grotesk ml-2 flex-1" numberOfLines={1}>
                  {document.fileName}
                </Text>
              </View>
              <Text className="text-neutral-400 text-xs font-grotesk">
                {formatFileSize(document.fileSize)}
              </Text>
            </View>

            <View className="items-end">
              <View className="flex-row items-center">
                <Calendar size={14} color="#737373" />
                <Text className="text-neutral-500 text-xs font-grotesk ml-2">
                  {formatDate(document.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}
