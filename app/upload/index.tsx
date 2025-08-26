// app/upload/index.tsx (redesigned)
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { databases, APPWRITE_CONFIG, account } from "../../lib/appwrite";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import {
  Upload,
  File,
  Image,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";

// Document categories
const CATEGORIES = [
  "General Circulars",
  "Subject-Specific",
  "Department Circulars",
  "Exams",
  "Academic",
  "Opportunities",
  "Placement",
  "Extracurricular",
  "Internships",
  "Other",
];

// Department options (same as profile)
const DEPARTMENT_OPTIONS = [
  "Computer Science",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication",
  "Information Technology",
  "Chemical Engineering",
  "Biotechnology",
  "Aerospace Engineering",
  "Other",
];

// Semester options
const SEMESTER_OPTIONS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "All",
];

interface SelectedFile {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
}

// Get authentication token
const getAuthToken = async (): Promise<string> => {
  try {
    const session = await account.getSession("current");
    return session.secret;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    throw new Error("Authentication required. Please log in again.");
  }
};

// Enhanced upload function with proper authentication
const uploadWithAuth = async (
  fileData: any,
  bucketId: string,
): Promise<any> => {
  try {
    const authToken = await getAuthToken();
    const url = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files`;

    const formData = new FormData();
    formData.append("fileId", "unique()");
    formData.append("file", fileData);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
        "X-Appwrite-Response-Format": "1.4.0",
        "x-sdk-version": "appwrite:react-native:10.0.0",
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Authenticated upload failed:", error);
    throw error;
  }
};

export default function UploadScreen() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    subjectName: "", // New field for Subject-Specific
    targetDepartments: [] as string[],
    targetSemesters: [] as string[],
    description: "",
  });

  // Check if user is teacher
  if (user?.role !== "teacher") {
    return (
      <SafeAreaView className="flex-1 bg-neutral-200">
        <View className="flex-1 justify-center items-center px-6">
          <Card className="bg-white rounded-2xl p-8 border border-neutral-300 w-full">
            <View className="items-center">
              <View className="bg-neutral-200 p-4 rounded-full mb-4">
                <AlertCircle size={32} color="#a3a3a3" />
              </View>
              <Text className="text-black font-groteskBold text-xl text-center mb-2">
                Access Restricted
              </Text>
              <Text className="text-neutral-400 font-grotesk text-center mb-6">
                Teacher privileges required to upload documents
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-lime-400 px-8 py-4 rounded-2xl"
              >
                <Text className="text-black font-groteskBold">Go Back</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/*",
          "text/plain",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile({
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimeType: file.mimeType,
      });
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setSelectedFile({
        name: asset.fileName || `image_${Date.now()}.jpg`,
        uri: asset.uri,
        size: asset.fileSize,
        mimeType: asset.mimeType || "image/jpeg",
      });
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert("Error", "Please select a file to upload");
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a title for the document");
      return;
    }

    if (!formData.category) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    // Additional validation for Subject-Specific category
    if (formData.category === "Subject-Specific") {
      if (!formData.subjectName.trim()) {
        Alert.alert(
          "Error",
          "Please enter a subject name for Subject-Specific documents",
        );
        return;
      }
      if (formData.targetDepartments.length === 0) {
        Alert.alert(
          "Error",
          "Please select at least one target department for Subject-Specific documents",
        );
        return;
      }
      if (formData.targetSemesters.length === 0) {
        Alert.alert(
          "Error",
          "Please select at least one target semester for Subject-Specific documents",
        );
        return;
      }
    }

    setIsUploading(true);

    try {
      const fileExtension = selectedFile.name.split(".").pop() || "";
      const uniqueFileName = `${Date.now()}_${formData.title.replace(/\s+/g, "_")}.${fileExtension}`;

      let fileType = selectedFile.mimeType || "application/octet-stream";
      if (!selectedFile.mimeType) {
        const match = /\.(\w+)$/.exec(selectedFile.name);
        if (match) {
          const ext = match[1].toLowerCase();
          if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
            fileType = `image/${ext}`;
          } else if (ext === "pdf") {
            fileType = "application/pdf";
          }
        }
      }

      const fileData = {
        uri: selectedFile.uri,
        name: uniqueFileName,
        type: fileType,
      };

      const storageResponse = await uploadWithAuth(
        fileData,
        APPWRITE_CONFIG.bucketId,
      );

      const fileUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${storageResponse.$id}/view?project=${APPWRITE_CONFIG.projectId}`;

      // Create document record with ALL required attributes
      const documentData = {
        title: formData.title.trim(),
        fileUrl,
        category: formData.category,
        targetDepartments: formData.targetDepartments,
        targetSemesters: formData.targetSemesters,
        uploadedBy: user.$id,
        createdAt: new Date().toISOString(),
        // Include subjectName (can be null/undefined for non-subject-specific)
        subjectName:
          formData.category === "Subject-Specific"
            ? formData.subjectName.trim()
            : formData.subjectName.trim() || undefined,
        // Include description (can be null/undefined)
        description: formData.description.trim() || undefined,
        // Include fileName - use the original file name
        fileName: selectedFile.name,
        // Include fileSize - convert to number (double)
        fileSize: selectedFile.size || 0,
      };

      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.documents,
        "unique()",
        documentData,
      );

      // Reset form after successful upload
      setSelectedFile(null);
      setFormData({
        title: "",
        category: "",
        subjectName: "",
        targetDepartments: [],
        targetSemesters: [],
        description: "",
      });

      Alert.alert("Success", "File uploaded successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error: any) {
      console.error("Upload error details:", error);
      let errorMessage = "Failed to upload file. ";

      if (error.message.includes("Authentication")) {
        errorMessage +=
          "Authentication failed. Please log out and log in again.";
      } else if (error.message.includes("Network")) {
        errorMessage +=
          "Network error. Please check your connection and try again.";
      } else if (error.message.includes("413")) {
        errorMessage += "File too large. Please choose a smaller file.";
      } else if (error.message.includes("415")) {
        errorMessage +=
          "File type not supported. Please choose a different file.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      Alert.alert("Upload Error", errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const testConnection = async () => {
    try {
      const authToken = await getAuthToken();
      const testUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files`;

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 200) {
        Alert.alert(
          "Connection Test",
          "Successfully connected with authentication!",
        );
      } else {
        Alert.alert(
          "Connection Test",
          `Server responded with status: ${response.status}`,
        );
      }
    } catch (error: any) {
      console.error("Connection test failed:", error);
      Alert.alert(
        "Connection Test Failed",
        `Authentication error: ${error.message}`,
      );
    }
  };

  const toggleDepartment = (department: string) => {
    setFormData((prev) => ({
      ...prev,
      targetDepartments: prev.targetDepartments.includes(department)
        ? prev.targetDepartments.filter((d) => d !== department)
        : [...prev.targetDepartments, department],
    }));
  };

  const toggleSemester = (semester: string) => {
    setFormData((prev) => ({
      ...prev,
      targetSemesters: prev.targetSemesters.includes(semester)
        ? prev.targetSemesters.filter((s) => s !== semester)
        : [...prev.targetSemesters, semester],
    }));
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const isSubjectSpecific = formData.category === "Subject-Specific";

  return (
    <SafeAreaView className="flex-1 bg-neutral-200">
      {/* Header */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-black font-groteskBold text-2xl">
            Upload Document
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white p-3 rounded-full border border-neutral-300"
          >
            <X size={20} color="#000" />
          </TouchableOpacity>
        </View>
        <Text className="text-neutral-400 font-grotesk mt-2">
          Share documents with your students
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Connection Test Button */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={testConnection}
            className="bg-white border border-neutral-300 p-4 rounded-2xl items-center justify-center"
          >
            <Text className="text-black font-grotesk">
              Test Server Connection
            </Text>
          </TouchableOpacity>
        </View>

        {/* File Selection */}
        <View className="px-6 mb-6">
          <Card className="bg-white rounded-2xl p-6 border border-neutral-300">
            <Text className="text-black font-groteskBold text-lg mb-4">
              Select File
            </Text>

            {selectedFile ? (
              <View className="border-2 border-lime-400 rounded-2xl p-4 bg-lime-50 mb-4">
                <View className="flex-row items-center">
                  <View className="bg-lime-400 p-2 rounded-full">
                    <CheckCircle size={20} color="black" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-groteskBold text-black">
                      {selectedFile.name}
                    </Text>
                    {selectedFile.size && (
                      <Text className="text-neutral-400 font-grotesk text-sm">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    )}
                    {selectedFile.mimeType && (
                      <Text className="text-neutral-400 font-grotesk text-xs">
                        {selectedFile.mimeType}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={removeFile}
                    disabled={isUploading}
                    className="bg-neutral-200 p-2 rounded-full"
                  >
                    <X size={16} color="#a3a3a3" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={pickDocument}
                  className="flex-1 bg-neutral-200 p-6 rounded-2xl items-center border border-neutral-300"
                  disabled={isUploading}
                >
                  <View className="bg-black p-3 rounded-full mb-3">
                    <File size={24} color="white" />
                  </View>
                  <Text className="text-black font-groteskBold">Document</Text>
                  <Text className="text-neutral-400 font-grotesk text-xs text-center mt-1">
                    PDF, DOC, TXT
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                  className="flex-1 bg-neutral-200 p-6 rounded-2xl items-center border border-neutral-300"
                  disabled={isUploading}
                >
                  <View className="bg-black p-3 rounded-full mb-3">
                    <Image size={24} color="white" />
                  </View>
                  <Text className="text-black font-groteskBold">Image</Text>
                  <Text className="text-neutral-400 font-grotesk text-xs text-center mt-1">
                    JPG, PNG, etc.
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>

        {/* Document Details Form */}
        <View className="px-6 mb-6">
          <Card className="bg-white rounded-2xl p-6 border border-neutral-300">
            <Text className="text-black font-groteskBold text-lg mb-6">
              Document Details
            </Text>

            <View className="mb-6">
              <Text className="text-black font-grotesk mb-2">Title *</Text>
              <TextInput
                className="border border-neutral-300 rounded-2xl p-4 font-grotesk text-black"
                placeholder="Enter document title"
                placeholderTextColor="#a3a3a3"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                editable={!isUploading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-black font-grotesk mb-2">Category *</Text>
              <View className="border border-neutral-300 rounded-2xl">
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  enabled={!isUploading}
                  style={{ color: "#000" }}
                >
                  <Picker.Item label="Select Category" value="" />
                  {CATEGORIES.map((category) => (
                    <Picker.Item
                      key={category}
                      label={category}
                      value={category}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Subject Name Field (always shown, required only for Subject-Specific) */}
            <View className="mb-6">
              <Text className="text-black font-grotesk mb-2">
                Subject Name {isSubjectSpecific ? "*" : ""}
              </Text>
              <TextInput
                className="border border-neutral-300 rounded-2xl p-4 font-grotesk text-black"
                placeholder="Enter subject name"
                placeholderTextColor="#a3a3a3"
                value={formData.subjectName}
                onChangeText={(text) =>
                  setFormData({ ...formData, subjectName: text })
                }
                editable={!isUploading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-black font-grotesk mb-2">Description</Text>
              <TextInput
                className="border border-neutral-300 rounded-2xl p-4 h-24 font-grotesk text-black"
                placeholder="Enter description (optional)"
                placeholderTextColor="#a3a3a3"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                textAlignVertical="top"
                editable={!isUploading}
              />
            </View>

            {/* Target Departments */}
            <View className="mb-6">
              <Text className="text-black font-grotesk mb-3">
                Target Departments {isSubjectSpecific ? "*" : "(Optional)"}
              </Text>
              <View className="flex-row flex-wrap">
                {DEPARTMENT_OPTIONS.map((department) => (
                  <TouchableOpacity
                    key={department}
                    onPress={() => toggleDepartment(department)}
                    disabled={isUploading}
                    className={`mr-2 mb-2 px-4 py-2 rounded-full border ${formData.targetDepartments.includes(department)
                        ? "bg-lime-400 border-lime-400"
                        : "bg-neutral-200 border-neutral-300"
                      }`}
                  >
                    <Text
                      className={`font-grotesk text-sm ${formData.targetDepartments.includes(department)
                          ? "text-black"
                          : "text-neutral-400"
                        }`}
                    >
                      {department}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Semesters */}
            <View className="mb-6">
              <Text className="text-black font-grotesk mb-3">
                Target Semesters {isSubjectSpecific ? "*" : "(Optional)"}
              </Text>
              <View className="flex-row flex-wrap">
                {SEMESTER_OPTIONS.map((semester) => (
                  <TouchableOpacity
                    key={semester}
                    onPress={() => toggleSemester(semester)}
                    disabled={isUploading}
                    className={`mr-2 mb-2 px-4 py-2 rounded-full border ${formData.targetSemesters.includes(semester)
                        ? "bg-lime-400 border-lime-400"
                        : "bg-neutral-200 border-neutral-300"
                      }`}
                  >
                    <Text
                      className={`font-grotesk text-sm ${formData.targetSemesters.includes(semester)
                          ? "text-black"
                          : "text-neutral-400"
                        }`}
                    >
                      {semester}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        </View>

        {/* Upload Button */}
        <View className="px-6">
          <TouchableOpacity
            onPress={uploadFile}
            disabled={isUploading || !selectedFile}
            className={`p-6 rounded-2xl items-center justify-center ${isUploading || !selectedFile ? "bg-neutral-300" : "bg-lime-400"
              }`}
          >
            {isUploading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="black" size="small" />
                <Text className="text-black font-groteskBold ml-3">
                  Uploading...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Upload size={20} color="black" />
                <Text className="text-black font-groteskBold ml-3">
                  Upload Document
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
