import crypto from "node:crypto";
import { Op } from "sequelize";
import { sequelize } from "../../db/index.js";
import { Policy, WorkerProfile } from "../../models/index.js";

const POLICY_DURATION_DAYS = 7;
const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

const PLAN_CATALOG = {
  basic: {
    code: "basic",
    planName: "Basic Plan",
    weeklyPremium: 40,
    coveragePerDay: 300,
    triggers: {
      rain: 50,
      aqi: 400,
      flood: false,
      curfew: true,
    },
  },
  pro: {
    code: "pro",
    planName: "Pro Plan",
    weeklyPremium: 55,
    coveragePerDay: 500,
    triggers: {
      rain: 50,
      aqi: 400,
      flood: true,
      curfew: true,
    },
  },
};

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isPolicyCurrentlyActive(policy, now = new Date()) {
  return policy && policy.status === "active" && new Date(policy.endDate) > now;
}

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function getPlanCodeFromName(planName) {
  if (!planName || typeof planName !== "string") {
    return null;
  }

  return planName.toLowerCase().includes("pro") ? "pro" : "basic";
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function buildPolicyNumber(policyId) {
  return `POL-${String(policyId).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function buildPolicyRange(startDate, endDate) {
  return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
}

function buildRazorpayAuthHeader() {
  const keyId = normalizeString(process.env.RAZORPAY_KEY_ID);
  const keySecret = normalizeString(process.env.RAZORPAY_KEY_SECRET);

  if (!keyId || !keySecret) {
    const error = new Error(
      "Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
    error.statusCode = 500;
    throw error;
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function callRazorpay(path, options = {}) {
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: buildRazorpayAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const rawBody = await response.text();
  let payload = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error?.description || payload?.error?.reason || rawBody ||
        `Razorpay request failed (HTTP ${response.status}).`,
    );
    error.statusCode = Number(payload?.error?.code) || response.status || 500;
    error.details = payload;
    throw error;
  }

  return payload;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const keySecret = normalizeString(process.env.RAZORPAY_KEY_SECRET);

  if (!keySecret) {
    const error = new Error(
      "Razorpay credentials are missing. Set RAZORPAY_KEY_SECRET.",
    );
    error.statusCode = 500;
    throw error;
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

function toPolicyDisplay(policy) {
  const planCode = getPlanCodeFromName(policy.planName);

  return {
    policyNumber: buildPolicyNumber(policy.id),
    planCode,
    validRange: buildPolicyRange(policy.startDate, policy.endDate),
    premiumPaid: policy.weeklyPremium,
    liveStatus:
      policy.status === "active" ? "LIVE PROTECTION ACTIVE" : policy.status.toUpperCase(),
  };
}

function getStatusCode(error) {
  return Number(error?.statusCode) || 500;
}

function toPolicyResponse(policy) {
  if (!policy) return null;

  const display = toPolicyDisplay(policy);

  return {
    id: policy.id,
    policyNumber: display.policyNumber,
    userId: policy.userId,
    planCode: display.planCode,
    planName: policy.planName,
    weeklyPremium: policy.weeklyPremium,
    premiumPaid: display.premiumPaid,
    coveragePerDay: policy.coveragePerDay,
    validRange: display.validRange,
    liveStatus: display.liveStatus,
    zone: policy.zone,
    city: policy.city,
    triggers: policy.triggers,
    startDate: policy.startDate,
    endDate: policy.endDate,
    status: policy.status,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}

async function syncWorkerProtectionState(
  userId,
  {
    isProtected,
    planCode,
    coveragePerDay,
  },
  transaction,
) {
  const workerProfile = await WorkerProfile.findOne({
    where: { userId },
    transaction,
  });

  if (!workerProfile) {
    return;
  }

  await workerProfile.update(
    {
      isProtected,
      activePlan: planCode || null,
      coveragePerDay: coveragePerDay || 0,
    },
    { transaction },
  );
}

async function expireOutdatedPolicies(userId) {
  await Policy.update(
    { status: "expired" },
    {
      where: {
        userId,
        status: "active",
        endDate: {
          [Op.lte]: new Date(),
        },
      },
    },
  );
}

async function reconcileProtectionStateFromPolicy(userId) {
  const activePolicy = await Policy.findOne({
    where: {
      userId,
      status: "active",
      endDate: {
        [Op.gt]: new Date(),
      },
    },
    order: [["createdAt", "DESC"]],
  });

  if (!activePolicy) {
    await syncWorkerProtectionState(
      userId,
      {
        isProtected: false,
        planCode: null,
        coveragePerDay: 0,
      },
      undefined,
    );
    return null;
  }

  const planCode = activePolicy.planName.toLowerCase().includes("pro")
    ? "pro"
    : "basic";

  await syncWorkerProtectionState(
    userId,
    {
      isProtected: true,
      planCode,
      coveragePerDay: activePolicy.coveragePerDay,
    },
    undefined,
  );

  return activePolicy;
}

export function getAvailablePlans() {
  return Object.values(PLAN_CATALOG).map((plan) => ({
    code: plan.code,
    planName: plan.planName,
    weeklyPremium: plan.weeklyPremium,
    coveragePerDay: plan.coveragePerDay,
    triggers: plan.triggers,
  }));
}

export async function createPolicyCheckoutForUser(userId, payload) {
  const planCode = normalizeString(payload?.plan)?.toLowerCase();
  const zone = normalizeString(payload?.zone);
  const city = normalizeString(payload?.city);

  if (!planCode || !PLAN_CATALOG[planCode]) {
    const error = new Error("Invalid plan. Choose 'basic' or 'pro'.");
    error.statusCode = 400;
    throw error;
  }

  if (!zone || !city) {
    const error = new Error("Both zone and city are required.");
    error.statusCode = 400;
    throw error;
  }

  await expireOutdatedPolicies(userId);

  const activePolicy = await Policy.findOne({
    where: { userId, status: "active" },
    order: [["createdAt", "DESC"]],
  });

  if (isPolicyCurrentlyActive(activePolicy)) {
    const error = new Error(
      "An active policy already exists. Cancel or renew it before buying again.",
    );
    error.statusCode = 409;
    throw error;
  }

  const selectedPlan = PLAN_CATALOG[planCode];
  const amount = Math.round(Number(selectedPlan.weeklyPremium) * 100);
  const keyId = normalizeString(process.env.RAZORPAY_KEY_ID);

  if (!keyId) {
    const error = new Error(
      "Razorpay credentials are missing. Set RAZORPAY_KEY_ID.",
    );
    error.statusCode = 500;
    throw error;
  }

  const receipt = `gigzo-${userId}-${planCode}-${Date.now()}`;
  const order = await callRazorpay("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt,
      notes: {
        userId: String(userId),
        planCode,
        zone,
        city,
      },
    }),
  });

  return {
    keyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    plan: {
      code: selectedPlan.code,
      planName: selectedPlan.planName,
      weeklyPremium: selectedPlan.weeklyPremium,
      coveragePerDay: selectedPlan.coveragePerDay,
      triggers: selectedPlan.triggers,
    },
    zone,
    city,
  };
}

export async function confirmPolicyPurchaseForUser(userId, payload) {
  const planCode = normalizeString(payload?.plan)?.toLowerCase();
  const zone = normalizeString(payload?.zone);
  const city = normalizeString(payload?.city);
  const razorpayOrderId = normalizeString(payload?.razorpayOrderId);
  const razorpayPaymentId = normalizeString(payload?.razorpayPaymentId);
  const razorpaySignature = normalizeString(payload?.razorpaySignature);

  if (!planCode || !PLAN_CATALOG[planCode]) {
    const error = new Error("Invalid plan. Choose 'basic' or 'pro'.");
    error.statusCode = 400;
    throw error;
  }

  if (!zone || !city) {
    const error = new Error("Both zone and city are required.");
    error.statusCode = 400;
    throw error;
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    const error = new Error("Razorpay payment verification data is missing.");
    error.statusCode = 400;
    throw error;
  }

  if (!verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  })) {
    const error = new Error("Invalid Razorpay payment signature.");
    error.statusCode = 400;
    throw error;
  }

  const order = await callRazorpay(`/orders/${razorpayOrderId}`, {
    method: "GET",
  });

  const selectedPlan = PLAN_CATALOG[planCode];
  const expectedAmount = Math.round(Number(selectedPlan.weeklyPremium) * 100);

  if (Number(order.amount) !== expectedAmount) {
    const error = new Error("Payment amount does not match the selected plan.");
    error.statusCode = 400;
    throw error;
  }

  return purchasePolicyForUser(userId, {
    plan: planCode,
    zone,
    city,
  });
}

export async function purchasePolicyForUser(userId, payload) {
  const planCode = normalizeString(payload?.plan)?.toLowerCase();
  const zone = normalizeString(payload?.zone);
  const city = normalizeString(payload?.city);

  if (!planCode || !PLAN_CATALOG[planCode]) {
    const error = new Error("Invalid plan. Choose 'basic' or 'pro'.");
    error.statusCode = 400;
    throw error;
  }

  if (!zone || !city) {
    const error = new Error("Both zone and city are required.");
    error.statusCode = 400;
    throw error;
  }

  await expireOutdatedPolicies(userId);

  const activePolicy = await Policy.findOne({
    where: { userId, status: "active" },
    order: [["createdAt", "DESC"]],
  });

  if (isPolicyCurrentlyActive(activePolicy)) {
    const error = new Error("An active policy already exists. Cancel or renew it.");
    error.statusCode = 409;
    throw error;
  }

  const selectedPlan = PLAN_CATALOG[planCode];
  const startDate = new Date();
  const endDate = addDays(startDate, POLICY_DURATION_DAYS);

  const policy = await sequelize.transaction(async (transaction) => {
    const created = await Policy.create(
      {
        userId,
        planName: selectedPlan.planName,
        weeklyPremium: selectedPlan.weeklyPremium,
        coveragePerDay: selectedPlan.coveragePerDay,
        zone,
        city,
        triggers: selectedPlan.triggers,
        startDate,
        endDate,
        status: "active",
      },
      { transaction },
    );

    await syncWorkerProtectionState(
      userId,
      {
        isProtected: true,
        planCode,
        coveragePerDay: selectedPlan.coveragePerDay,
      },
      transaction,
    );

    return created;
  });

  return toPolicyResponse(policy);
}

export async function getCurrentPolicyForUser(userId) {
  await expireOutdatedPolicies(userId);

  const activePolicy = await reconcileProtectionStateFromPolicy(userId);

  if (isPolicyCurrentlyActive(activePolicy)) {
    return toPolicyResponse(activePolicy);
  }

  return null;
}

export async function renewPolicyForUser(userId) {
  await expireOutdatedPolicies(userId);

  const policy = await Policy.findOne({
    where: { userId, status: "active" },
    order: [["createdAt", "DESC"]],
  });

  if (!isPolicyCurrentlyActive(policy)) {
    const error = new Error("No active policy found to renew.");
    error.statusCode = 404;
    throw error;
  }

  const renewed = await sequelize.transaction(async (transaction) => {
    const currentEndDate = new Date(policy.endDate);
    const extendedEndDate = addDays(currentEndDate, POLICY_DURATION_DAYS);

    await policy.update(
      {
        endDate: extendedEndDate,
        status: "active",
      },
      { transaction },
    );

    await syncWorkerProtectionState(
      userId,
      {
        isProtected: true,
        planCode: policy.planName.toLowerCase().includes("pro") ? "pro" : "basic",
        coveragePerDay: policy.coveragePerDay,
      },
      transaction,
    );

    return policy;
  });

  return toPolicyResponse(renewed);
}

export async function cancelPolicyForUser(userId) {
  await expireOutdatedPolicies(userId);

  const policy = await Policy.findOne({
    where: { userId, status: "active" },
    order: [["createdAt", "DESC"]],
  });

  if (!isPolicyCurrentlyActive(policy)) {
    const error = new Error("No active policy found to cancel.");
    error.statusCode = 404;
    throw error;
  }

  const cancelled = await sequelize.transaction(async (transaction) => {
    await policy.update(
      {
        status: "cancelled",
        endDate: new Date(),
      },
      { transaction },
    );

    await syncWorkerProtectionState(
      userId,
      {
        isProtected: false,
        planCode: null,
        coveragePerDay: 0,
      },
      transaction,
    );

    return policy;
  });

  return toPolicyResponse(cancelled);
}

export function formatPolicyServiceError(error) {
  return {
    statusCode: getStatusCode(error),
    message: error?.message || "Policy service operation failed.",
  };
}
