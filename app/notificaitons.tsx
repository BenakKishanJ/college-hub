// app/notifications.tsx
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-2xl">Notifications</Text>
        <Text className="text-gray-400 mt-2">No new notifications</Text>
      </View>
    </SafeAreaView>
  );
}
