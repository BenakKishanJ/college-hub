// app/(tabs)/department.tsx
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
  Building2,
  BookOpen,
  Filter,
  SortAsc,
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { TextInput } from "../../components/TextInput";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

interface Document {
  $id: string;
  title: string;
  fileUrl: string;
  category: string;
  subjectName?: string;
  targetDepartments?: string[];
  targetSemesters?: string[];
  description?: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: string;
}

interface SubjectGroup {
  subjectName: string;
  data: Document[];
}

type SortOption = "newest" | "oldest" | "title" | "size";

export default function DepartmentScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentCirculars, setDepartmentCirculars] = useState<Document[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterAndGroupDocuments();
  }, [documents, searchQuery, user, sortBy]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.documents,
        [
          Query.or([
            Query.equal("category", "Department Circulars"),
            Query.equal("category", "Subject-Specific"),
          ]),
          Query.orderDesc("createdAt"),
        ],
      );

      const docs = response.documents as unknown as Document[];
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      Alert.alert("Error", "Failed to load department materials");
    } finally {
      setLoading(false);
    }
  };

  const sortDocuments = (docs: Document[]): Document[] => {
    return [...docs].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "size":
          return b.fileSize - a.fileSize;
        default:
          return 0;
      }
    });
  };

  const filterAndGroupDocuments = () => {
    let filtered = [...documents];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Separate department circulars and sort them
    const circulars = sortDocuments(
      filtered.filter((doc) => doc.category === "Department Circulars")
    );
    setDepartmentCirculars(circulars);

    // Filter and group subject-specific documents
    const subjectSpecific = filtered.filter(
      (doc) =>
        doc.category === "Subject-Specific" && isDocumentAccessible(doc, user),
    );

    // Group subject-specific documents by subjectName
    const subjectGroupsMap = new Map<string, Document[]>();

    subjectSpecific.forEach((doc) => {
      if (doc.subjectName) {
        if (!subjectGroupsMap.has(doc.subjectName)) {
          subjectGroupsMap.set(doc.subjectName, []);
        }
        subjectGroupsMap.get(doc.subjectName)!.push(doc);
      }
    });

    const groups: SubjectGroup[] = Array.from(subjectGroupsMap.entries())
      .map(([subjectName, data]) => ({
        subjectName,
        data: sortDocuments(data)
      }))
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    setSubjectGroups(groups);
  };

  const isDocumentAccessible = (doc: Document, currentUser: any): boolean => {
    // If no restrictions, document is accessible to all
    if (!doc.targetDepartments?.length && !doc.targetSemesters?.length) {
      return true;
    }

    // Check department access
    const hasDepartmentAccess =
      !doc.targetDepartments?.length ||
      (currentUser?.department &&
        doc.targetDepartments.includes(currentUser.department));

    // Check semester access
    const hasSemesterAccess =
      !doc.targetSemesters?.length ||
      (currentUser?.semester &&
        doc.targetSemesters.includes(currentUser.semester));

    return hasDepartmentAccess && hasSemesterAccess;
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
            {isDownloading ? (
              <ActivityIndicator size={18} color="#a3a3a3" />
            ) : (
              <Download size={18} color="black" />
            )}
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

  const renderSubjectSection = (subject: SubjectGroup) => (
    <View key={subject.subjectName} className="mb-6">
      <View className="flex-row items-center mb-4 pb-2 border-b border-neutral-200">
        <BookOpen size={20} color="#a3a3a3" />
        <Text className="text-xl font-groteskBold text-black ml-2">
          {subject.subjectName}
        </Text>
        <View className="ml-auto bg-lime-400 px-2 py-1 rounded-full">
          <Text className="text-black text-xs font-groteskBold">
            {subject.data.length}
          </Text>
        </View>
      </View>
      {subject.data.map((document) => renderDocumentCard(document, true))}
    </View>
  );

  const renderSortOptions = () => (
    <View className="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
      <Text className="text-black font-groteskBold mb-3">Sort by</Text>
      <View className="flex-row flex-wrap gap-2">
        {[
          { key: "newest", label: "Newest" },
          { key: "oldest", label: "Oldest" },
          { key: "title", label: "Title" },
          { key: "size", label: "File Size" },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setSortBy(option.key as SortOption)}
            className={`px-3 py-2 rounded-full border ${sortBy === option.key
              ? "bg-lime-400 border-lime-400"
              : "bg-white border-neutral-200"
              }`}
          >
            <Text
              className={`text-sm font-grotesk ${sortBy === option.key ? "text-black font-groteskBold" : "text-neutral-400"
                }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-200">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#a3f948" />
          <Text className="text-black font-grotesk mt-4">
            Loading department materials...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasContent = departmentCirculars.length > 0 || subjectGroups.length > 0;
  const totalDocuments = departmentCirculars.length + subjectGroups.reduce((acc, group) => acc + group.data.length, 0);

  return (
    <SafeAreaView className="flex-1 bg-neutral-200">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }} // Add this line
      >
        {/* Header */}
        <View className="px-6 py-6 bg-white border-b border-neutral-200">
          <Text className="text-3xl font-groteskBold text-black mb-2">Department</Text>
          <Text className="text-neutral-400 font-grotesk">
            {user?.department} • Semester {user?.semester}
          </Text>
          {hasContent && (
            <Text className="text-lime-400 font-groteskBold text-sm mt-1">
              {totalDocuments} documents available
            </Text>
          )}
        </View>

        {/* Search and Filter Bar */}
        <View className="px-6 py-4 bg-white border-b border-neutral-200">
          <View className="flex-row items-center bg-neutral-200 rounded-lg px-4 py-3 mb-3">
            <Search size={20} color="#a3a3a3" />
            <TextInput
              className="flex-1 ml-3 text-black font-grotesk"
              placeholder="Search department materials..."
              placeholderTextColor="#a3a3a3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="flex-row items-center bg-neutral-200 px-3 py-2 rounded-lg"
            >
              <Filter size={16} color="#a3a3a3" />
              <Text className="text-neutral-400 font-grotesk ml-2">Sort & Filter</Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <SortAsc size={16} color="#a3a3a3" />
              <Text className="text-neutral-400 font-grotesk ml-1 capitalize">{sortBy}</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4">
          {showFilters && renderSortOptions()}

          {!hasContent ? (
            <View className="flex-1 justify-center items-center py-16">
              <Building2 size={64} color="#a3a3a3" />
              <Text className="text-neutral-400 font-grotesk text-center mt-4 text-lg">
                {searchQuery
                  ? "No department materials match your search"
                  : "No materials available for your department"}
              </Text>
              <Text className="text-neutral-400 font-grotesk text-center mt-2">
                Check back later for updates
              </Text>
            </View>
          ) : (
            <>
              {/* Subject-Specific Materials Section */}
              {subjectGroups.length > 0 && (
                <View className="mb-8">
                  <View className="flex-row items-center mb-4 pb-3 border-b-2 border-lime-400">
                    <BookOpen size={24} color="black" />
                    <Text className="text-2xl font-groteskBold text-black ml-2">
                      Subject Materials
                    </Text>
                  </View>
                  {subjectGroups.map((subject) => renderSubjectSection(subject))}
                </View>
              )}

              {/* Department Circulars Section */}
              {departmentCirculars.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center mb-4 pb-3 border-b-2 border-lime-400">
                    <Building2 size={24} color="black" />
                    <Text className="text-2xl font-groteskBold text-black ml-2">
                      Department Circulars
                    </Text>
                    <View className="ml-auto bg-lime-400 px-3 py-1 rounded-full">
                      <Text className="text-black text-sm font-groteskBold">
                        {departmentCirculars.length}
                      </Text>
                    </View>
                  </View>
                  {departmentCirculars.map((document) => renderDocumentCard(document))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
