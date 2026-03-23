import { Platform } from "react-native";

export function getApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://localhost:5000";
}
