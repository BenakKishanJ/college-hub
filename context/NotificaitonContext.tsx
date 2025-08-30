// context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { databases, APPWRITE_CONFIG } from '../lib/appwrite';
import { useAuth } from './AuthContext';

// Configure notification behavior with proper type
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // Added missing property
    shouldShowList: true,   // Added missing property
  }),
});

interface NotificationContextType {
  expoPushToken: string;
  notification: any;
  isNotificationEnabled: boolean;
  isLoading: boolean;
  registerForPushNotifications: () => Promise<boolean>;
  checkNotificationStatus: () => Promise<void>;
  schedulePushNotification: (title: string, body: string, data?: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<any>(null); // Fixed type
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Save push token to user document
  const savePushTokenToUser = useCallback(async (token: string, userId: string) => {
    try {
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        userId,
        {
          pushToken: token,
          lastTokenUpdate: new Date().toISOString(),
        }
      );
      console.log('Push token saved successfully for user:', userId);
      return true;
    } catch (error: any) {
      console.error('Error saving push token:', error);

      // Handle specific Appwrite errors
      if (error.message?.includes('Invalid document structure')) {
        console.error('Push token field may not exist in user schema or has size restrictions');
      }

      return false;
    }
  }, []);

  // Core function to register for push notifications
  const registerForPushNotifications = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert('Error', 'Must use physical device for Push Notifications');
      return false;
    }

    setIsLoading(true);
    let success = false;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings to receive updates.');
        setIsLoading(false);
        return false;
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Get project ID - fixed property access
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        (Constants.expoConfig as any)?.projectId; // Type assertion

      if (!projectId) {
        Alert.alert('Configuration Error', 'Push notifications are not properly configured.');
        setIsLoading(false);
        return false;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      if (!token) {
        throw new Error('Failed to get push token');
      }

      setExpoPushToken(token);
      setIsNotificationEnabled(true);

      // Save token to user document if user is authenticated
      if (user?.$id) {
        success = await savePushTokenToUser(token, user.$id);
        if (success) {
          console.log('Notifications enabled successfully');
        }
      } else {
        success = true; // Token obtained, but user not logged in yet
      }

    } catch (error: any) {
      console.error('Error registering for push notifications:', error);
      Alert.alert('Error', 'Failed to enable notifications. Please try again.');
      success = false;
    } finally {
      setIsLoading(false);
    }

    return success;
  }, [user, savePushTokenToUser]);

  // Check current notification status
  const checkNotificationStatus = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const hasPermission = status === 'granted';

      setIsNotificationEnabled(hasPermission);

      // If user has a push token stored, update local state
      if (user?.pushToken) {
        setExpoPushToken(user.pushToken);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  }, [user]);

  // Schedule a local notification (for testing) - fixed trigger type
  const schedulePushNotification = useCallback(async (title: string, body: string, data: any = {}) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: {
          type: 'timeInterval', // Added required type property
          seconds: 1,
          repeats: false
        } as Notifications.TimeIntervalTriggerInput,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }, []);

  // Set up notification listeners
  useEffect(() => {
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received:', response);
    });

    // Check initial notification status
    checkNotificationStatus();

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, [checkNotificationStatus]);

  // When user changes, update notification status
  useEffect(() => {
    if (user) {
      checkNotificationStatus();

      // If user has push token but we don't have it locally, set it
      if (user.pushToken && user.pushToken !== expoPushToken) {
        setExpoPushToken(user.pushToken);
        setIsNotificationEnabled(true);
      }
    } else {
      // User logged out, reset state
      setExpoPushToken('');
      setIsNotificationEnabled(false);
    }
  }, [user, expoPushToken, checkNotificationStatus]);

  // Clean up tokens when user logs out
  useEffect(() => {
    if (!user && expoPushToken) {
      // User logged out, clear local token state
      setExpoPushToken('');
      setIsNotificationEnabled(false);
    }
  }, [user, expoPushToken]);

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    isNotificationEnabled,
    isLoading,
    registerForPushNotifications,
    checkNotificationStatus,
    schedulePushNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
