// app/upload/index.tsx
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
import { Upload, File, Image, FileText, X } from "lucide-react-native";

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
    return session.secret; // This is the API key for authenticated requests
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

    console.log("Uploading with authentication...");

    // Create FormData properly for React Native
    const formData = new FormData();
    formData.append("fileId", "unique()");
    formData.append("file", fileData);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
        "X-Appwrite-Response-Format": "1.4.0",
        "x-sdk-version": "appwrite:react-native:10.0.0",
        Authorization: `Bearer ${authToken}`, // Add authentication header
      },
      body: formData,
    });

    console.log("Upload response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload error response:", errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Upload successful:", result);
    return result;
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
    targetDepartments: [] as string[],
    targetSemesters: [] as string[],
    description: "",
  });

  // Check if user is teacher
  if (user?.role !== "teacher") {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-lg text-gray-600 text-center">
            Access denied. Teacher privileges required to upload files.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
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

    setIsUploading(true);

    try {
      console.log("Starting authenticated file upload...");

      // Generate unique filename
      const fileExtension = selectedFile.name.split(".").pop() || "";
      const uniqueFileName = `${Date.now()}_${formData.title.replace(/\s+/g, "_")}.${fileExtension}`;

      // Get file type
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

      // Create file object for FormData
      const fileData = {
        uri: selectedFile.uri,
        name: uniqueFileName,
        type: fileType,
      };

      console.log("Uploading file:", fileData);

      // Try authenticated upload first
      const storageResponse = await uploadWithAuth(
        fileData,
        APPWRITE_CONFIG.bucketId,
      );

      console.log("File uploaded successfully:", storageResponse);

      // Get file URL
      const fileUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${storageResponse.$id}/view?project=${APPWRITE_CONFIG.projectId}`;

      console.log("File URL:", fileUrl);

      // Create document record in database
      const documentData = {
        title: formData.title.trim(),
        fileUrl,
        category: formData.category,
        targetDepartments: formData.targetDepartments,
        targetSemesters: formData.targetSemesters,
        uploadedBy: user.$id,
        createdAt: new Date().toISOString(),
      };

      console.log("Creating document record...");
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.documents,
        "unique()",
        documentData,
      );

      console.log("Document record created successfully");

      // Reset form after successful upload
      setSelectedFile(null);
      setFormData({
        title: "",
        category: "",
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

  // Test connection function
  const testConnection = async () => {
    try {
      console.log("Testing connection to Appwrite server...");

      // Test with authentication
      const authToken = await getAuthToken();
      const testUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files`;

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("Authenticated test status:", response.status);

      if (response.status === 200) {
        Alert.alert(
          "Connection Test",
          "✓ Successfully connected with authentication!",
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
        `Authentication error: ${error.message}\n\nPlease make sure you're logged in and have upload permissions.`,
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 bg-gray-50 p-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Upload Document
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Connection Test Button */}
        <TouchableOpacity
          onPress={testConnection}
          className="bg-gray-500 p-3 rounded-lg items-center justify-center mb-6"
        >
          <Text className="text-white font-semibold">
            Test Server Connection
          </Text>
        </TouchableOpacity>

        {/* File Selection */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Select File
          </Text>

          {selectedFile ? (
            <View className="border border-green-500 rounded-lg p-4 bg-green-50 mb-4">
              <View className="flex-row items-center">
                <FileText size={24} color="#10B981" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-green-800">
                    {selectedFile.name}
                  </Text>
                  {selectedFile.size && (
                    <Text className="text-sm text-green-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  )}
                  {selectedFile.mimeType && (
                    <Text className="text-xs text-green-500">
                      {selectedFile.mimeType}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={removeFile} disabled={isUploading}>
                  <X size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={pickDocument}
                className="flex-1 bg-blue-100 p-4 rounded-lg items-center"
                disabled={isUploading}
              >
                <File size={24} color="#3B82F6" />
                <Text className="text-blue-700 font-medium mt-2">Document</Text>
                <Text className="text-xs text-blue-600 text-center mt-1">
                  PDF, DOC, TXT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickImage}
                className="flex-1 bg-green-100 p-4 rounded-lg items-center"
                disabled={isUploading}
              >
                <Image size={24} color="#10B981" />
                <Text className="text-green-700 font-medium mt-2">Image</Text>
                <Text className="text-xs text-green-600 text-center mt-1">
                  JPG, PNG, etc.
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Document Details Form */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Document Details
          </Text>

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Document Title *"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            editable={!isUploading}
          />

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">Category *</Text>
            <View className="border border-gray-300 rounded-lg">
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                enabled={!isUploading}
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

          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4 h-20"
            placeholder="Description (Optional)"
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            multiline
            textAlignVertical="top"
            editable={!isUploading}
          />

          {/* Target Departments */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">
              Target Departments (Optional)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DEPARTMENT_OPTIONS.map((department) => (
                <TouchableOpacity
                  key={department}
                  onPress={() => toggleDepartment(department)}
                  disabled={isUploading}
                  className={`px-3 py-2 rounded-full ${formData.targetDepartments.includes(department)
                      ? "bg-blue-500"
                      : "bg-gray-200"
                    }`}
                >
                  <Text
                    className={`text-sm ${formData.targetDepartments.includes(department)
                        ? "text-white"
                        : "text-gray-700"
                      }`}
                  >
                    {department}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Semesters */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">
              Target Semesters (Optional)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SEMESTER_OPTIONS.map((semester) => (
                <TouchableOpacity
                  key={semester}
                  onPress={() => toggleSemester(semester)}
                  disabled={isUploading}
                  className={`px-3 py-2 rounded-full ${formData.targetSemesters.includes(semester)
                      ? "bg-green-500"
                      : "bg-gray-200"
                    }`}
                >
                  <Text
                    className={`text-sm ${formData.targetSemesters.includes(semester)
                        ? "text-white"
                        : "text-gray-700"
                      }`}
                  >
                    {semester}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          onPress={uploadFile}
          disabled={isUploading || !selectedFile}
          className="bg-blue-500 p-4 rounded-lg items-center justify-center mb-6"
          style={{ opacity: isUploading || !selectedFile ? 0.7 : 1 }}
        >
          {isUploading ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-semibold ml-2">
                Uploading...
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Upload size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Upload Document
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
