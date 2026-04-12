import { getApiBaseUrl } from "./apiBaseUrl";
import { getAccessToken } from "./authStorage";

const API_BASE_URL = getApiBaseUrl();

export type BackendUserProfile = {
  id: string;
  phone: string;
  firebaseUid: string | null;
  name: string | null;
  age: number | null;
  platform: "Zomato" | "Swiggy" | "Zepto" | "Blinkit" | "Amazon" | null;
  workerId: string | null;
  type: "full-time" | "part-time" | null;
  city: string | null;
  pincode: string | null;
  workingArea: string | null;
  workingHoursPerDay: number | null;
  avgDailyEarning: number | null;
  zone: string | null;
  coveragePerDay: number | null;
  activePlan: "basic" | "pro" | null;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
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

export type UpdateUserProfileInput = {
  name?: string;
  age?: number;
  platform?: "Zomato" | "Swiggy" | "Zepto" | "Blinkit" | "Amazon";
  workerId?: string;
  type?: "full-time" | "part-time";
  city?: string;
  pincode?: string;
  workingArea?: string;
  workingHoursPerDay?: number;
  avgDailyEarning?: number;
  zone?: string;
  coveragePerDay?: number;
  activePlan?: "basic" | "pro";
  isProtected?: boolean;
};

async function getAuthHeader() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Missing access token. Please verify OTP again.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function getMyProfile() {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "GET",
    headers,
  });

  const { payload, rawBody } = await parseApiResponse<
    ApiEnvelope<BackendUserProfile>
  >(response);

  if (!response.ok || !payload?.success || !payload.data) {
    const rawSummary = rawBody.trim().slice(0, 120);
    throw new Error(
      payload?.message ||
        (rawSummary
          ? `Unable to fetch profile (HTTP ${response.status}): ${rawSummary}`
          : `Unable to fetch profile (HTTP ${response.status}).`),
    );
  }

  return payload.data;
}

export async function updateMyProfile(input: UpdateUserProfileInput) {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  });

  const { payload, rawBody } = await parseApiResponse<
    ApiEnvelope<BackendUserProfile>
  >(response);

  if (!response.ok || !payload?.success || !payload.data) {
    const rawSummary = rawBody.trim().slice(0, 120);
    throw new Error(
      payload?.message ||
        (rawSummary
          ? `Unable to save profile (HTTP ${response.status}): ${rawSummary}`
          : `Unable to save profile (HTTP ${response.status}).`),
    );
  }

  return payload.data;
}
