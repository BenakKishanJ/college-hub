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
      const fileResponse = await fetch(fileAsset.uri);
      const blob = await fileResponse.blob();
      const user = await account.get();
      const fileId = ID.unique();
      // Create a File object from Blob
      const fileName = fileAsset.name || `document_${fileId}`;
      const fileToUpload = new File([blob], fileName, {
        type: fileAsset.mimeType || "application/octet-stream",
      });
      const uploadedFile = await storage.createFile(
        DOCUMENTS_BUCKET_ID,
        fileId,
        fileToUpload,
        ["role:teacher"],
      );
      const fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${DOCUMENTS_BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-8">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mb-6 self-start p-2 -ml-2"
          activeOpacity={0.7}
        >
          <Text className="text-black text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-black text-black mb-2 tracking-tight">
          Upload Document
        </Text>
        <Text className="text-gray-500 text-base leading-6">
          Share resources with your students
        </Text>
      </View>
      <View className="px-6 space-y-6">
        <View className="space-y-2">
          <Text className="text-sm font-medium text-black">Title *</Text>
          <TextInput
            className="w-full h-12 px-4 text-base text-black bg-white border border-gray-200 rounded-lg focus:border-black"
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
          <Text className="text-sm font-medium text-black">Category *</Text>
          <View className="border border-gray-200 rounded-lg bg-white">
            <Picker
              selectedValue={category}
              onValueChange={(value: string) => {
                setCategory(value);
                setError("");
              }}
              style={{ height: 48 }}
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
          <Text className="text-sm font-medium text-black">Department *</Text>
          <View className="border border-gray-200 rounded-lg bg-white">
            <Picker
              selectedValue={department}
              onValueChange={(value: string) => {
                setDepartment(value);
                setError("");
              }}
              style={{ height: 48 }}
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
          <Text className="text-sm font-medium text-black">Semester *</Text>
          <View className="border border-gray-200 rounded-lg bg-white">
            <Picker
              selectedValue={semester}
              onValueChange={(value: string) => {
                setSemester(value);
                setError("");
              }}
              style={{ height: 48 }}
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
          <Text className="text-sm font-medium text-black">File *</Text>
          <TouchableOpacity
            className="w-full h-12 bg-white border border-gray-200 rounded-lg items-center justify-center"
            onPress={pickDocument}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text className="text-black font-medium">
              {file && !file.canceled && file.assets
                ? file.assets[0].name
                : "Select File (PDF/Image)"}
            </Text>
          </TouchableOpacity>
        </View>
        {error && (
          <View className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <Text className="text-red-600 text-sm text-center">{error}</Text>
          </View>
        )}
        <TouchableOpacity
          className={`w-full h-12 rounded-lg items-center justify-center ${loading ? "bg-gray-400" : "bg-black active:bg-gray-800"}`}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Uploading..." : "Upload Document"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
