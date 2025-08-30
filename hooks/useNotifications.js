// hooks/useNotifications.js
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { databases, APPWRITE_CONFIG } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Define savePushTokenToUser with useCallback
  const savePushTokenToUser = useCallback(async (token, userId) => {
    if (!token || !userId) return;

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
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }, []);

  const registerForPushNotificationsAsync = useCallback(async () => {
    let token = '';

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return '';
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
          Constants.easConfig?.projectId ||
          Constants.expoConfig?.projectId;

        if (!projectId) {
          console.warn('Project ID not found. Push notifications may not work in development.');
          return '';
        }

        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
      } catch (e) {
        console.error('Error getting push token:', e);
        return '';
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }, []);

  useEffect(() => {
    // Register for push notifications when component mounts
    const initNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        // Save token to user's document in Appwrite
        if (user && user.$id) {
          await savePushTokenToUser(token, user.$id);
        }
      }
    };

    initNotifications();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for notification interactions (taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationData = response.notification.request.content.data;
      handleNotificationResponse(notificationData);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, registerForPushNotificationsAsync, savePushTokenToUser]);

  const handleNotificationResponse = (data) => {
    if (data?.screen) {
      console.log('Navigate to:', data.screen, data);
    }
  };

  const schedulePushNotification = async (title, body, data = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: { seconds: 2 },
    });
  };

  return {
    expoPushToken,
    notification,
    schedulePushNotification,
    registerForPushNotificationsAsync,
  };
}
