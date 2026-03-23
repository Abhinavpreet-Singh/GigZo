import { getApiBaseUrl } from "./apiBaseUrl";
import { getAccessToken } from "./authStorage";

const API_BASE_URL = getApiBaseUrl();

type ProfileResponse = {
  success: boolean;
  data?: {
    id: string;
    phone: string;
    name: string | null;
    platform: string | null;
    city: string | null;
  };
  message?: string;
};

export async function fetchProfile() {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Missing access token.");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as ProfileResponse;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || "Failed to load profile.");
  }

  return payload.data;
}
