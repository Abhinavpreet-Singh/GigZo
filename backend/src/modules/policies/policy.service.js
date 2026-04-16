import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import { Op } from "sequelize";
import { sequelize } from "../../db/index.js";
import { Policy, WorkerProfile } from "../../models/index.js";

const POLICY_DURATION_DAYS = 7;

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

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
    error.statusCode = 500;
    throw error;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function getCheckoutSessionSecret() {
  return process.env.RAZORPAY_SESSION_SECRET || process.env.JWT_SECRET;
}

function getPlanCodeFromName(planName) {
  return String(planName || "").toLowerCase().includes("pro")
    ? "pro"
    : "basic";
}

function getPolicyNumber(policyId) {
  return `POL-${String(policyId).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function getValidRange(startDate, endDate) {
  const start = new Date(startDate).toLocaleDateString("en-IN");
  const end = new Date(endDate).toLocaleDateString("en-IN");
  return `${start} - ${end}`;
}

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

function getStatusCode(error) {
  return Number(error?.statusCode) || 500;
}

function toPolicyResponse(policy) {
  if (!policy) return null;

  const planCode = getPlanCodeFromName(policy.planName);

  return {
    id: policy.id,
    policyNumber: getPolicyNumber(policy.id),
    userId: policy.userId,
    planCode,
    planName: policy.planName,
    weeklyPremium: policy.weeklyPremium,
    coveragePerDay: policy.coveragePerDay,
    zone: policy.zone,
    city: policy.city,
    triggers: policy.triggers,
    startDate: policy.startDate,
    endDate: policy.endDate,
    validRange: getValidRange(policy.startDate, policy.endDate),
    status: policy.status,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}

function createCheckoutToken({ userId, orderId, planCode, zone, city, receipt }) {
  const sessionSecret = getCheckoutSessionSecret();

  if (!sessionSecret) {
    const error = new Error(
      "Razorpay session secret is missing. Set RAZORPAY_SESSION_SECRET or JWT_SECRET.",
    );
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    {
      userId,
      orderId,
      planCode,
      zone,
      city,
      receipt,
    },
    sessionSecret,
    { expiresIn: "15m" },
  );
}

function verifyCheckoutToken(token) {
  const sessionSecret = getCheckoutSessionSecret();

  if (!sessionSecret) {
    const error = new Error(
      "Razorpay session secret is missing. Set RAZORPAY_SESSION_SECRET or JWT_SECRET.",
    );
    error.statusCode = 500;
    throw error;
  }

  return jwt.verify(token, sessionSecret);
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    const error = new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
    error.statusCode = 500;
    throw error;
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(String(signature || ""));

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
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

  const profile = await WorkerProfile.findOne({
    where: { userId },
  });

  const resolvedZone = zone || normalizeString(profile?.zone);
  const resolvedCity = city || normalizeString(profile?.city);

  if (!resolvedZone || !resolvedCity) {
    const error = new Error("Both zone and city are required.");
    error.statusCode = 400;
    throw error;
  }

  const selectedPlan = PLAN_CATALOG[planCode];
  const razorpay = getRazorpayClient();
  const receipt = `gigzo_${userId}_${planCode}_${Date.now()}`;

  const order = await razorpay.orders.create({
    amount: Math.round(selectedPlan.weeklyPremium * 100),
    currency: "INR",
    receipt,
    notes: {
      userId: String(userId),
      planCode,
      zone: resolvedZone,
      city: resolvedCity,
    },
  });

  const checkoutToken = createCheckoutToken({
    userId,
    orderId: order.id,
    planCode,
    zone: resolvedZone,
    city: resolvedCity,
    receipt,
  });

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt,
    checkoutToken,
    plan: {
      code: selectedPlan.code,
      planName: selectedPlan.planName,
      weeklyPremium: selectedPlan.weeklyPremium,
      coveragePerDay: selectedPlan.coveragePerDay,
      triggers: selectedPlan.triggers,
    },
    zone: resolvedZone,
    city: resolvedCity,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

export async function purchasePolicyForUser(userId, payload) {
  const checkoutToken = normalizeString(payload?.checkoutToken);
  const razorpayOrderId = normalizeString(payload?.razorpayOrderId);
  const razorpayPaymentId = normalizeString(payload?.razorpayPaymentId);
  const razorpaySignature = normalizeString(payload?.razorpaySignature);

  if (
    !checkoutToken ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    const error = new Error("Missing payment verification details.");
    error.statusCode = 400;
    throw error;
  }

  const session = verifyCheckoutToken(checkoutToken);

  if (Number(session.userId) !== Number(userId)) {
    const error = new Error("Checkout session does not belong to this user.");
    error.statusCode = 401;
    throw error;
  }

  if (session.orderId !== razorpayOrderId) {
    const error = new Error("Checkout session does not match the payment order.");
    error.statusCode = 400;
    throw error;
  }

  const signatureValid = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!signatureValid) {
    const error = new Error("Invalid Razorpay payment signature.");
    error.statusCode = 400;
    throw error;
  }

  const planCode = session.planCode;
  const selectedPlan = PLAN_CATALOG[planCode];

  if (!selectedPlan) {
    const error = new Error("Invalid checkout session plan.");
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

  const startDate = new Date();
  const endDate = addDays(startDate, POLICY_DURATION_DAYS);

  const policy = await sequelize.transaction(async (transaction) => {
    const created = await Policy.create(
      {
        userId,
        planName: selectedPlan.planName,
        weeklyPremium: selectedPlan.weeklyPremium,
        coveragePerDay: selectedPlan.coveragePerDay,
        zone: session.zone,
        city: session.city,
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
