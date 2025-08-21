import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import {
  databases,
  APPWRITE_DATABASE_ID,
  DOCUMENTS_COLLECTION_ID,
} from "../utils/appwriteConfig";

export default function PingAppwrite() {
  const [status, setStatus] = useState("Pinging...");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          DOCUMENTS_COLLECTION_ID,
        );
        setStatus(`✅ Connected! Found ${result.total} documents.`);
      } catch (err: any) {
        setStatus("❌ Error: " + err.message);
      }
    };

    checkConnection();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{status}</Text>
    </View>
  );
}
