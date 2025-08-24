import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DepartmentScreen() {
  const { user } = useAuth();

  // Sample subjects - would come from backend
  const subjects = [
    { name: "Mathematics", newContent: true },
    { name: "Programming", newContent: false },
    { name: "Physics", newContent: true },
    { name: "Data Structures", newContent: false },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            {user?.department} Resources
          </Text>

          {/* Subjects Section */}
          <View className="mb-8">
            <Text className="text-xl font-semibold text-gray-800 mb-4">
              Your Subjects
            </Text>
            {subjects.map((subject, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white p-4 rounded-lg mb-3 shadow-sm flex-row justify-between items-center"
              >
                <Text className="text-lg font-medium text-gray-800">
                  {subject.name}
                </Text>
                {subject.newContent && (
                  <View className="bg-blue-500 rounded-full w-3 h-3" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Department Updates Section */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-4">
              Department Updates
            </Text>
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-gray-600">
                No department updates at the moment.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
