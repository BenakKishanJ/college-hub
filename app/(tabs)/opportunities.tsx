import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OpportunitiesScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Opportunities
          </Text>

          <View className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-blue-600 mb-2">
              Placements
            </Text>
            <Text className="text-gray-600">
              No placement opportunities at the moment.
            </Text>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-green-600 mb-2">
              Internships
            </Text>
            <Text className="text-gray-600">
              No internship opportunities at the moment.
            </Text>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-purple-600 mb-2">
              Extracurricular
            </Text>
            <Text className="text-gray-600">
              No extracurricular activities scheduled.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
