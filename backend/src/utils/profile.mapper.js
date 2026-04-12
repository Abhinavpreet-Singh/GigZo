const ALLOWED_PLATFORMS = [
  "Zomato",
  "Swiggy",
  "Zepto",
  "Blinkit",
  "Amazon",
  "Other",
];
const ALLOWED_TYPES = ["full-time", "part-time", "full_time", "part_time"];
const ALLOWED_PLANS = ["basic", "pro"];

function toPrismaWorkerType(value) {
  if (value === "full-time") {
    return "full_time";
  }

  if (value === "part-time") {
    return "part_time";
  }

  return value;
}

function fromPrismaWorkerType(value) {
  if (value === "full_time") {
    return "full-time";
  }

  if (value === "part_time") {
    return "part-time";
  }

  return value;
}

function asOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

function asOptionalInteger(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }

  return Math.trunc(num);
}

function asOptionalFloat(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }

  return num;
}

function asOptionalBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === "1" || value === 1) {
    return true;
  }

  if (value === "false" || value === "0" || value === 0) {
    return false;
  }

  return Boolean(value);
}

function asNumberOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function asJsonOrString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  return value;
}

export function splitProfilePayload(body) {
  const userPatch = {
    name: asOptionalString(body.name),
  };

  const profilePatch = {
    age: asOptionalInteger(body.age),
    platform: asOptionalString(body.platform),
    workerId: asOptionalString(body.workerId),
    type: toPrismaWorkerType(asOptionalString(body.type)),
    city: asOptionalString(body.city),
    zone: asOptionalString(body.zone),
    pincode: asOptionalString(body.pincode),
    workingArea: asJsonOrString(body.workingArea),
    workingHoursPerDay: asOptionalInteger(body.workingHoursPerDay),
    avgDailyEarning: asOptionalFloat(body.avgDailyEarning),
    coveragePerDay: asOptionalFloat(body.coveragePerDay),
    activePlan: asOptionalString(body.activePlan),
    isProtected: asOptionalBoolean(body.isProtected),
  };

  if (
    profilePatch.platform &&
    !ALLOWED_PLATFORMS.includes(profilePatch.platform)
  ) {
    const error = new Error("Invalid platform.");
    error.statusCode = 400;
    throw error;
  }

  if (profilePatch.type && !ALLOWED_TYPES.includes(profilePatch.type)) {
    const error = new Error("Invalid worker type.");
    error.statusCode = 400;
    throw error;
  }

  if (
    profilePatch.activePlan &&
    !ALLOWED_PLANS.includes(profilePatch.activePlan)
  ) {
    const error = new Error("Invalid active plan.");
    error.statusCode = 400;
    throw error;
  }

  for (const [key, value] of Object.entries(userPatch)) {
    if (value === undefined) {
      delete userPatch[key];
    }
  }

  for (const [key, value] of Object.entries(profilePatch)) {
    if (value === undefined) {
      delete profilePatch[key];
    }
  }

  return { userPatch, profilePatch };
}

export function formatUserProfile(user, profile = {}) {
  return {
    id: String(user.id),
    phone: user.phone,
    email: user.email ?? null,
    firebaseUid: user.firebaseUid,
    name: user.name ?? "",
    age: profile.age ?? null,
    platform: profile.platform ?? null,
    workerId: profile.workerId ?? null,
    type: fromPrismaWorkerType(profile.type) ?? null,
    city: profile.city ?? null,
    pincode: profile.pincode ?? null,
    workingArea: profile.workingArea ?? null,
    workingHoursPerDay: profile.workingHoursPerDay ?? null,
    avgDailyEarning: asNumberOrNull(profile.avgDailyEarning),
    zone: profile.zone ?? null,
    coveragePerDay: asNumberOrNull(profile.coveragePerDay),
    riskScore: asNumberOrNull(profile.riskScore),
    activePlan: profile.activePlan ?? null,
    isProtected: Boolean(profile.isProtected),
    deviceFingerprint: profile.deviceFingerprint ?? null,
    lastLocation: profile.lastLocation ?? null,
    lastActivityAt: profile.lastActivityAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
