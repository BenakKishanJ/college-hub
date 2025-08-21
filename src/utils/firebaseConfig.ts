// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRwuPbpZXKAr8iUtQWmPI2cdPogS2o6T8",
  authDomain: "college-hub-204ed.firebaseapp.com",
  projectId: "college-hub-204ed",
  storageBucket: "college-hub-204ed.firebasestorage.app",
  messagingSenderId: "908583085351",
  appId: "1:908583085351:web:be69441cf261a0d5bc3502",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);

export { auth, db };
