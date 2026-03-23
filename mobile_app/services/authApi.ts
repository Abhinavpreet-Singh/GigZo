import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

type FirebaseLoginResponse = {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    user: {
      id: string;
      phone: string;
      name: string | null;
      platform: string | null;
      city: string | null;
    };
  };
};

export async function firebaseLogin(idToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/firebase-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  const payload = (await response.json()) as FirebaseLoginResponse;

  if (!response.ok || !payload.success || !payload.data?.accessToken) {
    throw new Error(payload.message || "Authentication failed.");
  }

  return payload.data;
}
