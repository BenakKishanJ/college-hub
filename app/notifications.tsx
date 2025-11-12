// app/notifications.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  FileText,
  Building2,
  Calendar,
  ChevronRight,
  BellOff,
  ArrowLeft
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../lib/appwrite";
import { Query } from "appwrite";
import { Card } from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

interface NotificationItem {
  $id: string;
  title: string;
  body: string;
  data: string;
  sentAt: string;
  type: string;
  recipientCount: number;
  targetDepartments?: string[];
  targetSemesters?: string[];
  isRead?: boolean;
}

type RootStackParamList = {
  DocumentDetail: { documentId: string; notificationId: string };
  Documents: undefined;
  DepartmentCirculars: undefined;
  Notifications: undefined;
  // Add other screens as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { expoPushToken, registerForPushNotificationsAsync } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.notifications,
        [
          Query.orderDesc("sentAt"),
          Query.limit(50),
        ]
      );

      const allNotifications = response.documents as unknown as NotificationItem[];

      const userNotifications = allNotifications.filter(notification =>
        isNotificationRelevantToUser(notification, user)
      );

      setNotifications(userNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const isNotificationRelevantToUser = (notification: NotificationItem, currentUser: any): boolean => {
    if (!notification.targetDepartments?.length && !notification.targetSemesters?.length) {
      return true;
    }

    const departmentMatch = !notification.targetDepartments?.length ||
      (currentUser?.department && notification.targetDepartments.includes(currentUser.department));

    const semesterMatch = !notification.targetSemesters?.length ||
      (currentUser?.semester && notification.targetSemesters.includes(currentUser.semester));

    return departmentMatch && semesterMatch;
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev =>
        prev.map(notif =>
          notif.$id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_document':
        return <FileText size={20} color="#22c55e" />;
      case 'department_circular':
        return <Building2 size={20} color="#3b82f6" />;
      default:
        return <Bell size={20} color="#6b7280" />;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    try {
      const data = JSON.parse(notification.data);

      // Navigate based on notification type and data
      switch (notification.type) {
        case 'new_document':
          if (data.documentId) {
            // Navigate to the specific document
            navigation.navigate('DocumentDetail', {
              documentId: data.documentId,
              notificationId: notification.$id
            });
          } else {
            // Fallback to documents list
            navigation.navigate('Documents');
          }
          break;
        case 'department_circular':
          navigation.navigate('DepartmentCirculars');
          break;
        default:
          // Default navigation or stay on notifications
          console.log('Default notification action');
      }

      // Mark as read after navigation
      if (!notification.isRead) {
        await markAsRead(notification.$id);
      }
    } catch (error) {
      console.error('Error parsing notification data:', error);
      // Fallback action
      navigation.navigate('Documents');
    }
  };

  const renderNotificationCard = (notification: NotificationItem) => (
    <TouchableOpacity
      key={notification.$id}
      onPress={() => handleNotificationPress(notification)}
      className="mb-3"
    >
      <Card className={`bg-white border-l-4 ${notification.isRead
        ? 'border-l-transparent border-neutral-200'
        : 'border-l-lime-400 border-neutral-200'
        } p-4 shadow-sm`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-start flex-1 mr-3">
            <View className="mr-3 mt-1">
              {getNotificationIcon(notification.type)}
            </View>
            <View className="flex-1">
              <View className="flex-row items-start justify-between mb-2">
                <Text className={`flex-1 ${notification.isRead
                  ? 'text-neutral-600 font-grotesk'
                  : 'text-black font-groteskBold'
                  } text-base mr-2`}>
                  {notification.title}
                </Text>
                {!notification.isRead && (
                  <View className="w-2 h-2 bg-lime-400 rounded-full mt-2" />
                )}
              </View>
              <Text className="text-neutral-500 font-grotesk text-sm mb-3 leading-5">
                {notification.body}
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Calendar size={12} color="#a3a3a3" />
                  <Text className="text-neutral-400 text-xs font-grotesk ml-1">
                    {formatDate(notification.sentAt)}
                  </Text>
                </View>
                {notification.targetDepartments && notification.targetDepartments?.length > 0 && (
                  <View className="bg-neutral-100 px-2 py-1 rounded-full">
                    <Text className="text-neutral-500 text-xs font-grotesk">
                      {notification.targetDepartments?.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <ChevronRight size={16} color="#a3a3a3" />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#a3f948" />
          <Text className="text-black font-grotesk mt-4">
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const enableNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = await registerForPushNotificationsAsync();
        if (token && user?.$id) {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.users,
            user.$id,
            {
              pushToken: token,
              lastTokenUpdate: new Date().toISOString(),
            }
          );
          Alert.alert('Success', 'Notifications enabled!');
        }
      } else {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      Alert.alert('Error', 'Failed to enable notifications');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header */}
        <View className="px-6 py-6 bg-white border-b border-neutral-200">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-2 mr-3"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color="black" />
            </TouchableOpacity>

            <View className="flex-1 flex-row items-center justify-between">
              <Text className="text-3xl font-groteskBold text-black">Notifications</Text>
              <View className="flex-row items-center">
                <Bell size={24} color="black" />
                {unreadCount > 0 && (
                  <View className="bg-lime-400 rounded-full min-w-5 h-5 items-center justify-center ml-2">
                    <Text className="text-black text-xs font-groteskBold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <Text className="text-neutral-500 font-grotesk">
            Stay updated with the latest announcements
          </Text>

          {expoPushToken ? (
            <Text className="text-lime-600 font-groteskBold text-sm mt-1">
              Push notifications enabled
            </Text>
          ) : (
            <TouchableOpacity
              onPress={enableNotifications}
              className="bg-lime-400 px-6 py-3 rounded-lg mt-4 active:bg-lime-500"
            >
              <Text className="text-black font-groteskBold text-center">
                Enable Push Notifications
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View className="px-6 py-4 bg-white border-b border-neutral-200">
          <View className="flex-row bg-neutral-100 rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setFilter('all')}
              className={`flex-1 py-2 px-4 rounded-lg ${filter === 'all'
                ? 'bg-lime-400 shadow-sm'
                : 'bg-transparent'
                }`}
            >
              <Text className={`text-center font-grotesk ${filter === 'all'
                ? 'text-black font-groteskBold'
                : 'text-neutral-500'
                }`}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('unread')}
              className={`flex-1 py-2 px-4 rounded-lg ${filter === 'unread'
                ? 'bg-lime-400 shadow-sm'
                : 'bg-transparent'
                }`}
            >
              <Text className={`text-center font-grotesk ${filter === 'unread'
                ? 'text-black font-groteskBold'
                : 'text-neutral-500'
                }`}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        <View className="px-6 py-4">
          {filteredNotifications.length === 0 ? (
            <View className="flex-1 justify-center items-center py-16">
              <BellOff size={64} color="#d4d4d4" />
              <Text className="text-neutral-400 font-grotesk text-center mt-4 text-lg">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </Text>
              <Text className="text-neutral-400 font-grotesk text-center mt-2 text-sm">
                You'll be notified when new content is available
              </Text>
            </View>
          ) : (
            <>
              {filteredNotifications.map(renderNotificationCard)}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
