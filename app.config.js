// app.config.js
export default {
  expo: {
    name: "college-hub",
    slug: "college-hub",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow access to your photos to upload documents",
          cameraPermission:
            "Allow access to your camera to take photos for documents",
        },
      ],
    ],
    extra: {
      appwriteEndpoint: process.env.APPWRITE_ENDPOINT,
      appwriteProjectId: process.env.APPWRITE_PROJECT_ID,
      appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID,
      appwriteUsersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID,
      appwriteDocumentsCollectionId:
        process.env.APPWRITE_DOCUMENTS_COLLECTION_ID,
      appwriteNotificationsCollectionId:
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      appwriteAppConfigCollectionId:
        process.env.APPWRITE_APP_CONFIG_COLLECTION_ID,
      appwriteBucketId: process.env.APPWRITE_BUCKET_ID,
      eas: {
        projectId: "your-eas-project-id",
      },
    },
  },
};
