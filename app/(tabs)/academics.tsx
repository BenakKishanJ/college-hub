import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AcademicsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Academics
          </Text>

          <View className="flex-row mb-6">
            <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-l-lg flex-1">
              <Text className="text-white font-medium text-center">Exams</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-r-lg flex-1">
              <Text className="text-gray-800 font-medium text-center">
                Academic
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Exam Schedule
            </Text>
            <Text className="text-gray-600 mb-4">
              No exam schedules available yet.
            </Text>

            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Results
            </Text>
            <Text className="text-gray-600">No results published yet.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
