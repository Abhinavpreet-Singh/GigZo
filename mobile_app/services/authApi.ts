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

async function parseApiResponse<T>(response: Response): Promise<{
  payload: T | null;
  rawBody: string;
}> {
  const rawBody = await response.text();
  if (!rawBody) {
    return { payload: null, rawBody: "" };
  }

  try {
    return { payload: JSON.parse(rawBody) as T, rawBody };
  } catch {
    return { payload: null, rawBody };
  }
}

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

  const { payload, rawBody } = await parseApiResponse<FirebaseLoginResponse>(
    response,
  );

  if (!response.ok || !payload?.success || !payload.data?.accessToken) {
    if (payload?.message) {
      throw new Error(payload.message);
    }

    const rawSummary = rawBody.trim().slice(0, 120);

    throw new Error(
      `Authentication failed (HTTP ${response.status}). ` +
        (rawSummary
          ? `Server response: ${rawSummary}`
          : "The server returned an empty or invalid response."),
    );
  }

  return payload.data;
}
