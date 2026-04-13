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
  const url = `${API_BASE_URL}/api/auth/firebase-login`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request failed.";
    throw new Error(
      `Unable to reach backend at ${url}. ${message} ` +
        "Check that the server is running and that this device can access it.",
    );
  }

  let payload: FirebaseLoginResponse | null = null;
  try {
    payload = (await response.json()) as FirebaseLoginResponse;
  } catch {
    // Some backend failures return non-JSON bodies.
  }

  if (!response.ok || !payload?.success || !payload.data?.accessToken) {
    const backendMessage = payload?.message || "Authentication failed.";
    throw new Error(
      `${backendMessage} (status ${response.status}). ` +
        "Check Firebase Admin credentials and JWT settings on backend.",
    );
  }

  return payload.data;
}
