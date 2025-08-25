// app/(tabs)/department.tsx
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
  Building2,
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite";
import { Query } from "appwrite";
import { TextInput } from "../../components/TextInput";
import { useAuth } from "../../context/AuthContext";

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

export default function DepartmentScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentCirculars, setDepartmentCirculars] = useState<Document[]>(
    [],
  );
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterAndGroupDocuments();
  }, [documents, searchQuery, user]);

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

    // Separate department circulars
    const circulars = filtered.filter(
      (doc) => doc.category === "Department Circulars",
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
      .map(([subjectName, data]) => ({ subjectName, data }))
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
          },
        },
      ]);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download file");
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

  const renderDepartmentCircular = (item: Document) => (
    <View
      key={item.$id}
      className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-4"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg mb-1">
            {item.title}
          </Text>
          {item.description && (
            <Text className="text-gray-400 text-sm mb-2">
              {item.description}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleDownload(item)}
          className="bg-white p-2 rounded-lg"
        >
          <Download size={20} color="black" />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <FileText size={14} color="#6B7280" />
            <Text className="text-gray-400 text-sm ml-1">{item.fileName}</Text>
          </View>
          <Text className="text-gray-400 text-sm">
            {formatFileSize(item.fileSize)}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Calendar size={14} color="#6B7280" />
          <Text className="text-gray-400 text-sm ml-1">
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSubjectGroup = (item: SubjectGroup) => (
    <View key={item.subjectName} className="mb-6">
      <Text className="text-xl font-bold text-white mb-4">
        {item.subjectName}
      </Text>
      <View className="space-y-3">
        {item.data.map((document) => (
          <View
            key={document.$id}
            className="bg-gray-900 rounded-lg p-4 border border-gray-800"
          >
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">
                  {document.title}
                </Text>
                {document.description && (
                  <Text className="text-gray-400 text-xs mb-2">
                    {document.description}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDownload(document)}
                className="bg-white p-2 rounded-lg"
              >
                <Download size={16} color="black" />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center space-x-3">
                <Text className="text-gray-400 text-xs">
                  {document.fileName}
                </Text>
                <Text className="text-gray-400 text-xs">
                  {formatFileSize(document.fileSize)}
                </Text>
              </View>
              <Text className="text-gray-400 text-xs">
                {formatDate(document.createdAt)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <View className="bg-black py-4 border-b border-gray-800 mb-4">
      <Text className="text-2xl font-bold text-white">{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">
            Loading department materials...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasContent = departmentCirculars.length > 0 || subjectGroups.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6 border-b border-gray-800">
          <Text className="text-3xl font-bold text-white mb-2">Department</Text>
          <Text className="text-gray-400">
            Department circulars and subject-specific materials for{" "}
            {user?.department}
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 py-4 border-b border-gray-800">
          <View className="flex-row items-center bg-gray-900 rounded-lg px-4 py-3">
            <Search size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-white"
              placeholder="Search department materials..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Results */}
        <View className="px-6 pb-6">
          {!hasContent ? (
            <View className="flex-1 justify-center items-center py-12">
              <Building2 size={48} color="#6B7280" />
              <Text className="text-gray-400 text-center mt-4">
                {searchQuery
                  ? "No department materials match your search criteria"
                  : "No department materials available for your department/semester"}
              </Text>
            </View>
          ) : (
            <>
              {/* Department Circulars Section */}
              {departmentCirculars.length > 0 && (
                <View className="mb-6">
                  {renderSectionHeader("Department Circulars")}
                  {departmentCirculars.map((item) =>
                    renderDepartmentCircular(item),
                  )}
                </View>
              )}

              {/* Subject Materials Section */}
              {subjectGroups.length > 0 && (
                <View>
                  {renderSectionHeader("Subject Materials")}
                  {subjectGroups.map((item) => renderSubjectGroup(item))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
