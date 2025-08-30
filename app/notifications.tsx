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
  Trash2,
  MoreVertical,
  ArrowLeft
} from "lucide-react-native";
import { databases, APPWRITE_CONFIG } from "../lib/appwrite";
import { Query } from "appwrite";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

interface NotificationItem {
  $id: string;
  title: string;
  body: string;
  data: string;
  sentAt: string;
  type: string;
  recipientCount: number;
  targetDepartments?: string[]; // Make optional
  targetSemesters?: string[];   // Make optional
  isRead?: boolean;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { expoPushToken, registerForPushNotificationsAsync } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigation = useNavigation()

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      // Load notifications from database
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.notifications,
        [
          Query.orderDesc("sentAt"),
          Query.limit(50),
        ]
      );

      const allNotifications = response.documents as unknown as NotificationItem[];

      // Filter notifications relevant to current user
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
    // If no target restrictions, notification is for everyone
    if (!notification.targetDepartments?.length && !notification.targetSemesters?.length) {
      return true;
    }

    // Check if user's department matches target departments
    const departmentMatch = !notification.targetDepartments?.length ||
      (currentUser?.department && notification.targetDepartments.includes(currentUser.department));

    // Check if user's semester matches target semesters
    const semesterMatch = !notification.targetSemesters?.length ||
      (currentUser?.semester && notification.targetSemesters.includes(currentUser.semester));

    return departmentMatch && semesterMatch;
  };
  const markAsRead = async (notificationId: string) => {
    try {
      // Mark notification as read in local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.$id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );

      // You can also save read status to a separate user_notifications collection
      // if you want to persist read status per user
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

  const handleNotificationPress = (notification: NotificationItem) => {
    markAsRead(notification.$id);

    try {
      const data = JSON.parse(notification.data);

      // Navigate based on notification type
      switch (data.type) {
        case 'new_document':
          // Navigate to department screen or specific document
          console.log('Navigate to department screen');
          break;
        case 'department_circular':
          // Navigate to department screen
          console.log('Navigate to department screen');
          break;
        default:
          console.log('Default notification action');
      }
    } catch (error) {
      console.error('Error parsing notification data:', error);
    }
  };

  const renderNotificationCard = (notification: NotificationItem) => (
    <TouchableOpacity
      key={notification.$id}
      onPress={() => handleNotificationPress(notification)}
      className="mb-3"
    >
      <Card className={`bg-white border p-4 ${notification.isRead ? 'border-neutral-200' : 'border-lime-400 bg-lime-50'}`}>
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-start flex-1 mr-3">
            <View className="mr-3 mt-1">
              {getNotificationIcon(notification.type)}
            </View>
            <View className="flex-1">
              <Text className={`text-black ${notification.isRead ? 'font-grotesk' : 'font-groteskBold'} text-base mb-1`}>
                {notification.title}
              </Text>
              <Text className="text-neutral-400 font-grotesk text-sm mb-2">
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
                  <View className="bg-neutral-200 px-2 py-1 rounded-full">
                    <Text className="text-neutral-400 text-xs font-grotesk">
                      {notification.targetDepartments?.join(', ')}
                    </Text>
                  </View>
                )}              </View>
            </View>
          </View>
          <View className="items-center">
            {!notification.isRead && (
              <View className="w-2 h-2 bg-lime-400 rounded-full mb-2" />
            )}
            <ChevronRight size={16} color="#a3a3a3" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-200">
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
        // Manually trigger notification registration
        const token = await registerForPushNotificationsAsync();
        if (token && user?.$id) {
          // Save the token
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
    <SafeAreaView className="flex-1 bg-neutral-200">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header - FIXED */}
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

          <Text className="text-neutral-400 font-grotesk">
            Stay updated with the latest announcements
          </Text>
          {expoPushToken && (
            <Text className="text-lime-400 font-groteskBold text-sm mt-1">
              Push notifications enabled
            </Text>
          )}
          {!expoPushToken && (
            <TouchableOpacity
              onPress={enableNotifications}
              className="bg-lime-400 px-6 py-3 rounded-lg mt-4"
            >
              <Text className="text-black font-groteskBold text-center">
                Enable Push Notifications
              </Text>
            </TouchableOpacity>
          )}


        </View>
        {/* Filter Tabs */}
        <View className="px-6 py-4 bg-white border-b border-neutral-200">
          <View className="flex-row bg-neutral-200 rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setFilter('all')}
              className={`flex-1 py-2 px-4 rounded-lg ${filter === 'all' ? 'bg-lime-400' : 'bg-transparent'}`}
            >
              <Text className={`text-center font-grotesk ${filter === 'all' ? 'text-black font-groteskBold' : 'text-neutral-400'}`}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('unread')}
              className={`flex-1 py-2 px-4 rounded-lg ${filter === 'unread' ? 'bg-lime-400' : 'bg-transparent'}`}
            >
              <Text className={`text-center font-grotesk ${filter === 'unread' ? 'text-black font-groteskBold' : 'text-neutral-400'}`}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 py-4">
          {filteredNotifications.length === 0 ? (
            <View className="flex-1 justify-center items-center py-16">
              <BellOff size={64} color="#a3a3a3" />
              <Text className="text-neutral-400 font-grotesk text-center mt-4 text-lg">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </Text>
              <Text className="text-neutral-400 font-grotesk text-center mt-2">
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
