import "dotenv/config";

export default {
  expo: {
    name: "com.drait.college_hub",
    slug: "college-hub",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      appwriteEndpoint: process.env.APPWRITE_ENDPOINT,
      appwriteProjectId: process.env.APPWRITE_PROJECT_ID,
    },
  },
};
