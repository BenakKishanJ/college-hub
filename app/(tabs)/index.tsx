import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {user?.displayName}
          </Text>

          {/* General Circulars Section */}
          <View className="mb-6">
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              General Circulars
            </Text>
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-gray-600">
                No circulars available at the moment.
              </Text>
            </View>
          </View>

          {/* Notifications Summary */}
          <View className="mb-6">
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              Notifications
            </Text>
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-gray-600">You're all caught up!</Text>
            </View>
          </View>

          {/* Quick Links */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              Quick Access
            </Text>
            <View className="flex-row flex-wrap justify-between">
              <Link href="/department" asChild>
                <TouchableOpacity className="bg-blue-500 p-4 rounded-lg w-[48%] mb-3">
                  <Text className="text-white font-medium text-center">
                    {user?.department} Materials
                  </Text>
                </TouchableOpacity>
              </Link>
              <Link href="/academics" asChild>
                <TouchableOpacity className="bg-green-500 p-4 rounded-lg w-[48%] mb-3">
                  <Text className="text-white font-medium text-center">
                    Exam Schedule
                  </Text>
                </TouchableOpacity>
              </Link>
              <Link href="/opportunities" asChild>
                <TouchableOpacity className="bg-purple-500 p-4 rounded-lg w-[48%]">
                  <Text className="text-white font-medium text-center">
                    Opportunities
                  </Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity className="bg-orange-500 p-4 rounded-lg w-[48%]">
                <Text className="text-white font-medium text-center">
                  Academic Calendar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
