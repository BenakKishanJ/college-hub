// app/(tabs)/department.tsx
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
  Building2,
  BookOpen,
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
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set());

  const departmentIllustration = require('@/assets/images/department.png');

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
          <Text className="text-black mt-4 font-grotesk">Loading department materials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalDocuments = departmentCirculars.length + subjectGroups.reduce((acc, g) => acc + g.data.length, 0);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Profile and Notifications */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Text className="text-2xl font-groteskBold text-black">Department</Text>

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
            source={departmentIllustration}
            style={{ width: 350, height: 350 }}
            resizeMode="contain"
          />

          <View className="mt-8">
            <Text className="font-groteskBold text-2xl text-black text-center mb-2">
              {user?.department || "Department"} Resources
            </Text>
            <Text className="font-grotesk text-base text-neutral-500 text-center">
              {user?.semester ? `Semester ${user.semester} • ` : ""}Subject materials and department circulars
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

        {/* Sort and Results Row */}
        <View className="px-6 mb-6 flex-row items-center justify-between">
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

          <Text className="text-neutral-400 font-grotesk text-sm">
            {totalDocuments} item{totalDocuments !== 1 ? "s" : ""} found
          </Text>
        </View>

        {/* Content */}
        <View className="px-6 pb-8">
          {totalDocuments === 0 ? (
            <View className="flex-1 justify-center items-center py-20 bg-white border-2 border-black rounded-2xl">
              <Building2 size={56} color="#a3a3a3" />
              <Text className="text-neutral-400 text-center mt-4 font-grotesk text-base px-8">
                {searchQuery
                  ? "No department materials match your search criteria"
                  : "No materials available for your department yet"}
              </Text>
            </View>
          ) : (
            <View className="space-y-8">
              {/* Subject Materials */}
              {subjectGroups.length > 0 && (
                <View>
                  <View className="flex-row items-center mb-4 pb-2 border-b-2 border-black">
                    <BookOpen size={24} color="black" />
                    <Text className="text-xl font-groteskBold text-black ml-2">
                      Subject Materials
                    </Text>
                  </View>
                  {subjectGroups.map((group) => (
                    <View key={group.subjectName} className="mb-6">
                      <View className="flex-row items-center mb-3">
                        <Text className="text-lg font-groteskBold text-black flex-1">
                          {group.subjectName}
                        </Text>
                        <View className="bg-black px-3 py-1 rounded-full">
                          <Text className="text-white text-xs font-groteskBold">
                            {group.data.length}
                          </Text>
                        </View>
                      </View>
                      {group.data.map((doc) => (
                        <FileCard
                          key={doc.$id}
                          document={doc}
                          onDownload={handleDownload}
                          isDownloading={downloadingDocs.has(doc.$id)}
                          showDescription={true}
                          showFullDetails={true}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Department Circulars */}
              {departmentCirculars.length > 0 && (
                <View>
                  <View className="flex-row items-center mb-4 pb-2 border-b-2 border-black">
                    <Building2 size={24} color="black" />
                    <Text className="text-xl font-groteskBold text-black ml-2">
                      Department Circulars
                    </Text>
                  </View>
                  {departmentCirculars.map((doc) => (
                    <FileCard
                      key={doc.$id}
                      document={doc}
                      onDownload={handleDownload}
                      isDownloading={downloadingDocs.has(doc.$id)}
                      showDescription={true}
                      showFullDetails={true}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
