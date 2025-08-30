// utils/notificationUtils.js
import { databases, APPWRITE_CONFIG } from '../lib/appwrite';
import { Query } from 'appwrite';

// Function to send push notifications to all users
export async function sendNotificationToAllUsers(title, body, data = {}) {
  try {
    // Get all users with push tokens
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      [
        Query.isNotNull('pushToken'),
        Query.limit(1000), // Adjust based on your user base
      ]
    );

    const users = response.documents;
    const pushTokens = users.map(user => user.pushToken).filter(Boolean);

    if (pushTokens.length === 0) {
      console.log('No push tokens found');
      return;
    }

    // Send notifications using Expo Push API
    await sendPushNotifications(pushTokens, title, body, data);

    // Save notification to database for history
    await saveNotificationToDatabase(title, body, data, users.length);

  } catch (error) {
    console.error('Error sending notifications to all users:', error);
    throw error;
  }
}

// Function to send push notifications to specific department/semester
export async function sendNotificationToTargetUsers(title, body, targetDepartments = [], targetSemesters = [], data = {}) {
  try {
    let queries = [Query.isNotNull('pushToken')];

    // Add department filter if specified
    if (targetDepartments.length > 0) {
      queries.push(Query.equal('department', targetDepartments));
    }

    // Add semester filter if specified
    if (targetSemesters.length > 0) {
      queries.push(Query.equal('semester', targetSemesters));
    }

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      queries
    );

    const users = response.documents;
    const pushTokens = users.map(user => user.pushToken).filter(Boolean);

    if (pushTokens.length === 0) {
      console.log('No matching users with push tokens found');
      return;
    }

    await sendPushNotifications(pushTokens, title, body, data);
    await saveNotificationToDatabase(title, body, data, users.length, targetDepartments, targetSemesters);

  } catch (error) {
    console.error('Error sending targeted notifications:', error);
    throw error;
  }
}

// Core function to send push notifications via Expo Push API
async function sendPushNotifications(pushTokens, title, body, data = {}) {
  const messages = [];

  for (let pushToken of pushTokens) {
    // Check that all push tokens are valid Expo push tokens
    if (!pushToken.startsWith('ExponentPushToken')) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    });
  }

  // Send notifications in batches of 100 (Expo's limit)
  const batchSize = 100;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json();
      console.log('Push notification batch sent:', result);
    } catch (error) {
      console.error('Error sending push notification batch:', error);
    }
  }
}

// Save notification to database for history
async function saveNotificationToDatabase(title, body, data, recipientCount, targetDepartments = [], targetSemesters = []) {
  try {
    await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.notifications, // You'll need to create this collection
      'unique()',
      {
        title,
        body,
        data: JSON.stringify(data),
        recipientCount,
        targetDepartments,
        targetSemesters,
        sentAt: new Date().toISOString(),
        type: 'push',
        status: 'sent',
      }
    );
  } catch (error) {
    console.error('Error saving notification to database:', error);
  }
}

// Function to call when a new document is uploaded
export async function notifyNewDocumentUpload(document) {
  const title = '📄 New Document Available';
  const body = `${document.title} has been uploaded to ${document.category}`;
  const data = {
    type: 'new_document',
    documentId: document.$id,
    screen: 'department',
    category: document.category,
  };

  try {
    if (document.targetDepartments?.length > 0 || document.targetSemesters?.length > 0) {
      // Send to specific users
      await sendNotificationToTargetUsers(
        title,
        body,
        document.targetDepartments || [],
        document.targetSemesters || [],
        data
      );
    } else {
      // Send to all users
      await sendNotificationToAllUsers(title, body, data);
    }
  } catch (error) {
    console.error('Error sending new document notification:', error);
  }
}

// Function to send department circular notifications
export async function notifyDepartmentCircular(circular, department) {
  const title = '📢 New Department Circular';
  const body = `${circular.title} - ${department}`;
  const data = {
    type: 'department_circular',
    documentId: circular.$id,
    screen: 'department',
    department,
  };

  try {
    await sendNotificationToTargetUsers(title, body, [department], [], data);
  } catch (error) {
    console.error('Error sending department circular notification:', error);
  }
}
