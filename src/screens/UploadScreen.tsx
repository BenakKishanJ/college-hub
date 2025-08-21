import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import {
  account,
  databases,
  storage,
  APPWRITE_DATABASE_ID,
  DOCUMENTS_COLLECTION_ID,
  DOCUMENTS_BUCKET_ID,
} from "../utils/appwriteConfig";
import { getCurrentUserProfile } from "../utils/authUtils";
import * as DocumentPicker from "expo-document-picker";
import { ID } from "appwrite";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UploadScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const categories = [
    { label: "Select Category", value: "" },
    { label: "Notes", value: "notes" },
    { label: "Assignment", value: "assignment" },
    { label: "Question Paper", value: "questionPaper" },
    { label: "Syllabus", value: "syllabus" },
  ];

  const departments = [
    { label: "Select Department", value: "" },
    { label: "Computer Science", value: "Computer Science" },
    { label: "Mechanical Engineering", value: "Mechanical Engineering" },
    { label: "Electrical Engineering", value: "Electrical Engineering" },
    { label: "Civil Engineering", value: "Civil Engineering" },
    {
      label: "Electronics & Communication",
      value: "Electronics & Communication",
    },
    { label: "Information Technology", value: "Information Technology" },
    { label: "All Departments", value: "All" },
  ];

  const semesters = [
    { label: "Select Semester", value: "" },
    { label: "1st Semester", value: "1st" },
    { label: "2nd Semester", value: "2nd" },
    { label: "3rd Semester", value: "3rd" },
    { label: "4th Semester", value: "4th" },
    { label: "5th Semester", value: "5th" },
    { label: "6th Semester", value: "6th" },
    { label: "7th Semester", value: "7th" },
    { label: "8th Semester", value: "8th" },
    { label: "All Semesters", value: "All" },
  ];

  useEffect(() => {
    const checkRole = async () => {
      const profile = await getCurrentUserProfile();
      if (profile?.role === "teacher") {
        setIsTeacher(true);
      } else {
        setError("Only teachers can upload documents");
        Alert.alert(
          "Access Denied",
          "Only teachers can access the upload feature.",
        );
        navigation.goBack();
      }
    };
    checkRole();
  }, [navigation]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result);
        setError("");
      } else {
        setError("No file selected");
      }
    } catch (err) {
      setError("Failed to pick document. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!isTeacher) return;
    if (!title.trim()) return setError("Please enter a title");
    if (!category) return setError("Please select a category");
    if (!department) return setError("Please select a department");
    if (!semester) return setError("Please select a semester");
    if (!file || file.canceled || !file.assets)
      return setError("Please select a file");

    setLoading(true);
    try {
      const fileAsset = file.assets[0];
      const user = await account.get();
      const fileId = ID.unique();
      const fileName = fileAsset.name || `document_${fileId}`;

      // Convert file URI to File object for React Native
      const fileResponse = await fetch(fileAsset.uri);
      const blob = await fileResponse.blob();

      // Create File object from blob
      const fileToUpload = new File([blob], fileName, {
        type: fileAsset.mimeType || "application/octet-stream",
      });

      const uploadedFile = await storage.createFile(
        DOCUMENTS_BUCKET_ID,
        fileId,
        fileToUpload,
        ["role:teacher"],
      );
      const fileUrl = storage.getFileView(DOCUMENTS_BUCKET_ID, fileId);

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        ID.unique(),
        {
          title: title.trim(),
          category,
          fileUrl,
          targets: {
            departments: department === "All" ? [] : [department],
            semesters: semester === "All" ? [] : [semester],
          },
          uploadedBy: user.$id,
          createdAt: new Date().toISOString(),
        },
        ["role:teacher"],
      );

      Alert.alert("Success", "Document uploaded successfully!");
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  if (!isTeacher) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <View className="w-12 h-12 bg-red-100 rounded-lg items-center justify-center mx-auto mb-4">
              <Text className="text-red-600 text-xl">⚠️</Text>
            </View>
            <Text className="text-red-600 text-center font-medium">
              {error}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 pb-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mb-6 self-start p-2 -ml-2"
          activeOpacity={0.7}
        >
          <Text className="text-gray-900 text-sm font-medium">← Back</Text>
        </TouchableOpacity>
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            Upload Document
          </Text>
          <Text className="text-gray-600 text-sm">
            Share resources and materials with your students
          </Text>
        </View>
      </View>

      <View className="px-6">
        <View className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">Title</Text>
            <TextInput
              className="w-full h-11 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:border-gray-900"
              placeholder="Enter document title"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError("");
              }}
              editable={!loading}
            />
          </View>

          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">Category</Text>
            <View className="border border-gray-300 rounded-md bg-white">
              <Picker
                selectedValue={category}
                onValueChange={(value: string) => {
                  setCategory(value);
                  setError("");
                }}
                style={{ height: 44 }}
                enabled={!loading}
              >
                {categories.map((cat) => (
                  <Picker.Item
                    key={cat.value}
                    label={cat.label}
                    value={cat.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">
              Department
            </Text>
            <View className="border border-gray-300 rounded-md bg-white">
              <Picker
                selectedValue={department}
                onValueChange={(value: string) => {
                  setDepartment(value);
                  setError("");
                }}
                style={{ height: 44 }}
                enabled={!loading}
              >
                {departments.map((dept) => (
                  <Picker.Item
                    key={dept.value}
                    label={dept.label}
                    value={dept.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">Semester</Text>
            <View className="border border-gray-300 rounded-md bg-white">
              <Picker
                selectedValue={semester}
                onValueChange={(value: string) => {
                  setSemester(value);
                  setError("");
                }}
                style={{ height: 44 }}
                enabled={!loading}
              >
                {semesters.map((sem) => (
                  <Picker.Item
                    key={sem.value}
                    label={sem.label}
                    value={sem.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">File</Text>
            <TouchableOpacity
              className="w-full h-11 bg-white border border-gray-300 rounded-md items-center justify-center active:bg-gray-50"
              onPress={pickDocument}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-5 h-5 bg-gray-900 rounded items-center justify-center mr-2">
                  <Text className="text-white text-xs">📎</Text>
                </View>
                <Text className="text-gray-900 font-medium text-sm flex-1 text-center">
                  {file && !file.canceled && file.assets
                    ? file.assets[0].name
                    : "Select File (PDF/Image)"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {error && (
            <View className="p-3 bg-red-50 border border-red-200 rounded-md">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`w-full h-11 rounded-md items-center justify-center ${loading ? "bg-gray-400" : "bg-gray-900 active:bg-gray-800"}`}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text className="text-white font-medium text-sm">
              {loading ? "Uploading..." : "Upload Document"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
