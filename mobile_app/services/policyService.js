import { getApiBaseUrl } from "./apiBaseUrl";
import { getAccessToken } from "./authStorage";

const API_BASE_URL = getApiBaseUrl();

async function parseApiResponse(response) {
  const rawBody = await response.text();
  if (!rawBody) {
    return { payload: null, rawBody: "" };
  }

  try {
    return { payload: JSON.parse(rawBody), rawBody };
  } catch {
    return { payload: null, rawBody };
  }
}

async function getAuthHeaders() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Missing access token. Please log in again.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function request(path, options = {}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const { payload, rawBody } = await parseApiResponse(response);

  if (!response.ok || !payload?.success) {
    const rawSummary = rawBody.trim().slice(0, 140);
    throw new Error(
      payload?.message ||
        (rawSummary
          ? `Policy request failed (HTTP ${response.status}): ${rawSummary}`
          : `Policy request failed (HTTP ${response.status}).`),
    );
  }

  return payload?.data ?? null;
}

export async function getPlans() {
  return request("/api/policies/plans", { method: "GET" });
}

export async function purchasePolicy(input) {
  return request("/api/policies/purchase", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMyPolicy() {
  return request("/api/policies/my-policy", { method: "GET" });
}

export async function renewPolicy() {
  return request("/api/policies/renew", { method: "POST" });
}

export async function cancelPolicy() {
  return request("/api/policies/cancel", { method: "POST" });
}
