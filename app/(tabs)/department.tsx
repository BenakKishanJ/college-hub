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
  SortAsc,
  SortDesc,
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

type SortOption = "newest" | "oldest";

export default function DepartmentScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentCirculars, setDepartmentCirculars] = useState<Document[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
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
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });
  };

  const filterAndGroupDocuments = () => {
    let filtered = [...documents];

    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    const circulars = sortDocuments(
      filtered.filter((doc) => doc.category === "Department Circulars")
    );
    setDepartmentCirculars(circulars);

    const subjectSpecific = filtered.filter(
      (doc) =>
        doc.category === "Subject-Specific" && isDocumentAccessible(doc, user),
    );

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
    if (!doc.targetDepartments?.length && !doc.targetSemesters?.length) return true;

    const hasDepartmentAccess =
      !doc.targetDepartments?.length ||
      (currentUser?.department && doc.targetDepartments.includes(currentUser.department));

    const hasSemesterAccess =
      !doc.targetSemesters?.length ||
      (currentUser?.semester && doc.targetSemesters.includes(currentUser.semester));

    return hasDepartmentAccess && hasSemesterAccess;
  };

  // === DOWNLOAD LOGIC (Same as Academics) ===
  const handleDownload = async (document: Document) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permissions to download files.');
        return;
      }

      Alert.alert(
        'Download',
        `Download ${document.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => downloadFile(document) },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const downloadFile = async (document: Document) => {
    try {
      const timestamp = new Date().getTime();
      const fileExtension = getFileExtension(document.fileName);
      const fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}${fileExtension}`;
      const downloadPath = `${FileSystem.documentDirectory}${fileName}`;

      Alert.alert('Downloading', `Downloading ${document.title}...`);

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

      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[document.$id];
          return newProgress;
        });
        await handleDownloadSuccess(result.uri, document, fileName);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[document.$id];
        return newProgress;
      });
      Alert.alert('Download Failed', 'Please check your connection and try again.');
    }
  };

  const handleDownloadSuccess = async (fileUri: string, document: Document, fileName: string) => {
    try {
      if (Platform.OS === 'ios') {
        if (await Sharing.isAvailableAsync()) {
          Alert.alert('Download Complete', `${document.title} downloaded!`, [
            { text: 'Share', onPress: () => Sharing.shareAsync(fileUri) },
            { text: 'OK' }
          ]);
        } else {
          Alert.alert('Download Complete', `File saved: ${fileName}`);
        }
      } else {
        try {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);
          Alert.alert('Download Complete', `${document.title} saved!`, [
            { text: 'Share', onPress: () => Sharing.shareAsync(fileUri) },
            { text: 'OK' }
          ]);
        } catch (mediaError) {
          if (await Sharing.isAvailableAsync()) {
            Alert.alert('Download Complete', 'You can share the file now.', [
              { text: 'Share', onPress: () => Sharing.shareAsync(fileUri) },
              { text: 'OK' }
            ]);
          } else {
            Alert.alert('Download Complete', 'File downloaded!');
          }
        }
      }
    } catch (error) {
      Alert.alert('Download Complete', 'File downloaded, sharing unavailable.');
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

            {isDownloading && (
              <View className="mt-2">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-lime-400 text-xs font-grotesk">Downloading...</Text>
                  <Text className="text-lime-400 text-xs font-groteskBold">{progress}%</Text>
                </View>
                <View className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                  <View className="h-full bg-lime-400 transition-all duration-300" style={{ width: `${progress}%` }} />
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-200">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#a3e635" />
          <Text className="text-black mt-4 font-grotesk">
            Loading department materials...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalDocuments = departmentCirculars.length + subjectGroups.reduce((acc, g) => acc + g.data.length, 0);

  return (
    <SafeAreaView className="flex-1 bg-neutral-200">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-4xl font-groteskBold text-black mb-2">
            Department
          </Text>
          <Text className="text-neutral-400 font-grotesk text-base">
            {user?.department} • Semester {user?.semester}
          </Text>
          {totalDocuments > 0 && (
            <Text className="text-lime-400 font-groteskBold text-sm mt-1">
              {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} available
            </Text>
          )}
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 shadow-sm border border-neutral-300">
            <Search size={20} color="#a3a3a3" />
            <TextInput
              className="flex-1 ml-3 text-black font-grotesk text-base"
              placeholder="Search materials, subjects..."
              placeholderTextColor="#a3a3a3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter and Sort Row */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row space-x-3">
              {(["all", "Circulars", "Subjects"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`px-6 py-3 rounded-full border ${(type === "all" && !searchQuery && departmentCirculars.length + subjectGroups.length > 0) ||
                      (type === "Circulars" && departmentCirculars.length > 0) ||
                      (type === "Subjects" && subjectGroups.length > 0)
                      ? "bg-lime-400 border-lime-400"
                      : "bg-white border-neutral-300"
                    }`}
                  onPress={() => { }}
                  disabled
                >
                  <Text
                    className={`font-grotesk font-medium ${(type === "all" && !searchQuery) ||
                        (type === "Circulars" && departmentCirculars.length > 0) ||
                        (type === "Subjects" && subjectGroups.length > 0)
                        ? "text-black" : "text-neutral-400"
                      }`}
                  >
                    {type === "all" ? "All" : type}
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
            {totalDocuments} item{totalDocuments !== 1 ? "s" : ""} found
          </Text>
        </View>

        {/* Content */}
        <View className="px-6 pb-6">
          {totalDocuments === 0 ? (
            <View className="flex-1 justify-center items-center py-16 bg-white rounded-2xl border border-neutral-300">
              <Building2 size={48} color="#a3a3a3" />
              <Text className="text-neutral-400 text-center mt-4 font-grotesk text-base px-8">
                {searchQuery
                  ? "No department materials match your search criteria"
                  : "No materials available for your department yet"}
              </Text>
            </View>
          ) : (
            <View className="space-y-6">
              {/* Subject Materials */}
              {subjectGroups.length > 0 && (
                <View>
                  <View className="flex-row items-center mb-4 pb-2 border-b-2 border-lime-400">
                    <BookOpen size={24} color="black" />
                    <Text className="text-xl font-groteskBold text-black ml-2">
                      Subject Materials
                    </Text>
                  </View>
                  {subjectGroups.map((group) => (
                    <View key={group.subjectName} className="mb-5">
                      <View className="flex-row items-center mb-3">
                        <Text className="text-lg font-groteskBold text-black flex-1">
                          {group.subjectName}
                        </Text>
                        <View className="bg-lime-400 px-2 py-1 rounded-full">
                          <Text className="text-black text-xs font-groteskBold">
                            {group.data.length}
                          </Text>
                        </View>
                      </View>
                      {group.data.map((doc) => renderDocumentCard(doc, true))}
                    </View>
                  ))}
                </View>
              )}

              {/* Department Circulars */}
              {departmentCirculars.length > 0 && (
                <View>
                  <View className="flex-row items-center mb-4 pb-2 border-b-2 border-lime-400">
                    <Building2 size={24} color="black" />
                    <Text className="text-xl font-groteskBold text-black ml-2">
                      Department Circulars
                    </Text>
                  </View>
                  {departmentCirculars.map((doc) => renderDocumentCard(doc))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
