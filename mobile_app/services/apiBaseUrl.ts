import { Platform } from "react-native";

export function getApiBaseUrl() {
  const backendTarget =
    process.env.EXPO_PUBLIC_BACKEND_TARGET?.trim().toLowerCase() ||
    (__DEV__ ? "dev" : "prod");
  const fromDevEnv = process.env.EXPO_PUBLIC_API_BASE_URL_DEV;
  const fromProdEnv = process.env.EXPO_PUBLIC_API_BASE_URL_PROD;

  const selectedUrl =
    backendTarget === "prod" || backendTarget === "production"
      ? fromProdEnv
      : fromDevEnv;

  if (!selectedUrl) {
    throw new Error(
      "Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL_DEV and EXPO_PUBLIC_API_BASE_URL_PROD in mobile_app/.env.",
    );
  }

  const normalized = selectedUrl.replace(/\/$/, "");

  if (
    Platform.OS === "android" &&
    (normalized.startsWith("http://localhost") ||
      normalized.startsWith("http://127.0.0.1"))
  ) {
    return normalized
      .replace("http://localhost", "http://10.0.2.2")
      .replace("http://127.0.0.1", "http://10.0.2.2");
  }

  return normalized;
}
