// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import {
  Home,
  BookOpen,
  Briefcase,
  Building2,
  User,
  Plus,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { View } from "react-native";

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#000000",
            borderTopWidth: 0,
            height: 90,
            paddingBottom: 20,
            paddingTop: 10,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            position: "absolute",
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: "white",
          tabBarInactiveTintColor: "#a3a3a3", // neutral-400
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginTop: 4,
            fontFamily: "SpaceGrotesk",
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="academics"
          options={{
            title: "Academics",
            tabBarIcon: ({ color, size }) => (
              <BookOpen size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="department"
          options={{
            title: user?.department?.split(" ")[0] || "Dept", // Show first word of department
            tabBarIcon: ({ color, size }) => (
              <Building2 size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="opportunities"
          options={{
            title: "Opportunities",
            tabBarIcon: ({ color, size }) => (
              <Briefcase size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
