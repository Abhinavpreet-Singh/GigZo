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

  return {
    id: policy.id,
    userId: policy.userId,
    planName: policy.planName,
    weeklyPremium: policy.weeklyPremium,
    coveragePerDay: policy.coveragePerDay,
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
