import { User, WorkerProfile } from "../models/index.js";
import sequelize from "../db/index.js";

const ALLOWED_PLATFORMS = ["Zomato", "Swiggy", "Zepto", "Blinkit", "Amazon"];
const ALLOWED_TYPES = ["full-time", "part-time"];
const ALLOWED_PLANS = ["basic", "pro"];

const USER_FIELDS = new Set([
  "firebaseUid",
  "phone",
  "name",
  "email",
  "passwordHash",
  "age",
  "lastLoginAt",
]);

const WORKER_FIELDS = new Set([
  "age",
  "platform",
  "workerId",
  "type",
  "city",
  "zone",
  "pincode",
  "workingArea",
  "workingHoursPerDay",
  "avgDailyEarning",
  "coveragePerDay",
  "riskScore",
  "activePlan",
  "isProtected",
  "deviceFingerprint",
  "lastLocation",
  "lastActivityAt",
]);

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
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
}

function normalizePayload(body, mode = "update") {
  const raw = {
    // User fields
    firebaseUid: asOptionalString(body.firebaseUid),
    phone: asOptionalString(body.phone),
    name: asOptionalString(body.name),
    email: asOptionalString(body.email),
    passwordHash: asOptionalString(body.passwordHash),
    age: asOptionalString(body.age),
    lastLoginAt:
      body.lastLoginAt === undefined || body.lastLoginAt === null
        ? undefined
        : new Date(body.lastLoginAt),

    // Worker profile fields
    platform: asOptionalString(body.platform),
    city: asOptionalString(body.city),
    zone: asOptionalString(body.zone),
    workerId: asOptionalString(body.workerId),
    workingArea: asOptionalString(body.workingArea),
    pincode: asOptionalString(body.pincode),
    type: asOptionalString(body.type),
    ageWorker: asOptionalInteger(body.age),
    workingHoursPerDay: asOptionalInteger(body.workingHoursPerDay),
    avgDailyEarning: asOptionalFloat(body.avgDailyEarning),
    riskScore: asOptionalFloat(body.riskScore),
    coveragePerDay: asOptionalFloat(body.coveragePerDay),
    activePlan: asOptionalString(body.activePlan),
    isProtected: asOptionalBoolean(body.isProtected),
    deviceFingerprint:
      body.deviceFingerprint === undefined ? undefined : body.deviceFingerprint,
    lastLocation: body.lastLocation === undefined ? undefined : body.lastLocation,
    lastActivityAt:
      body.lastActivityAt === undefined || body.lastActivityAt === null
        ? undefined
        : new Date(body.lastActivityAt),
  };

  if (raw.platform && !ALLOWED_PLATFORMS.includes(raw.platform)) {
    const error = new Error("Invalid platform.");
    error.statusCode = 400;
    throw error;
  }

  if (raw.type && !ALLOWED_TYPES.includes(raw.type)) {
    const error = new Error("Invalid worker type.");
    error.statusCode = 400;
    throw error;
  }

  if (raw.activePlan && !ALLOWED_PLANS.includes(raw.activePlan)) {
    const error = new Error("Invalid active plan.");
    error.statusCode = 400;
    throw error;
  }

  if (raw.lastLoginAt !== undefined && Number.isNaN(raw.lastLoginAt?.getTime())) {
    const error = new Error("Invalid lastLoginAt date.");
    error.statusCode = 400;
    throw error;
  }

  if (
    raw.lastActivityAt !== undefined &&
    Number.isNaN(raw.lastActivityAt?.getTime())
  ) {
    const error = new Error("Invalid lastActivityAt date.");
    error.statusCode = 400;
    throw error;
  }

  if (mode === "create" && !raw.phone) {
    const error = new Error("Phone is required.");
    error.statusCode = 400;
    throw error;
  }

  const userPayload = {};
  const workerPayload = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;

    // age is stored as text on users and as int on worker_profiles
    if (key === "ageWorker") {
      workerPayload.age = value;
      continue;
    }

    if (USER_FIELDS.has(key)) {
      userPayload[key] = value;
    } else if (WORKER_FIELDS.has(key)) {
      workerPayload[key] = value;
    }
  }

  return { userPayload, workerPayload };
}

function formatUser(user) {
  const profile = user.workerProfile || {};

  return {
    id: user.id,
    phone: user.phone,
    firebaseUid: user.firebaseUid,
    name: user.name,
    email: user.email,
    age: profile.age ?? null,
    platform: profile.platform ?? null,
    workerId: profile.workerId ?? null,
    type: profile.type ?? null,
    city: profile.city ?? null,
    zone: profile.zone ?? null,
    pincode: profile.pincode ?? null,
    workingArea: profile.workingArea ?? null,
    workingHoursPerDay: profile.workingHoursPerDay ?? null,
    avgDailyEarning: profile.avgDailyEarning ?? 0,
    riskScore: profile.riskScore ?? 0,
    isProtected: profile.isProtected ?? false,
    activePlan: profile.activePlan ?? "basic",
    coveragePerDay: profile.coveragePerDay ?? 0,
    deviceFingerprint: profile.deviceFingerprint ?? null,
    lastLocation: profile.lastLocation ?? null,
    lastActivityAt: profile.lastActivityAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getStatusCode(error) {
  return Number(error?.statusCode) || 500;
}

function mapSequelizeError(error) {
  if (error?.name === "SequelizeUniqueConstraintError") {
    const uniqueError = new Error(
      error?.errors?.[0]?.message || "Duplicate value for a unique field.",
    );
    uniqueError.statusCode = 409;
    return uniqueError;
  }

  if (error?.name === "SequelizeValidationError") {
    const validationError = new Error(
      error?.errors?.[0]?.message || "Validation failed.",
    );
    validationError.statusCode = 400;
    return validationError;
  }

  return error;
}

export async function listUsers(_req, res) {
  try {
    const users = await User.findAll({
      include: [{ model: WorkerProfile, as: "workerProfile" }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: users.map(formatUser),
    });
  } catch (error) {
    const mapped = mapSequelizeError(error);
    return res.status(getStatusCode(mapped)).json({
      success: false,
      message: mapped.message || "Failed to fetch users.",
    });
  }
}

export async function getUserById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const user = await User.findByPk(id, {
      include: [{ model: WorkerProfile, as: "workerProfile" }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    const mapped = mapSequelizeError(error);
    return res.status(getStatusCode(mapped)).json({
      success: false,
      message: mapped.message || "Failed to fetch user.",
    });
  }
}

export async function createUser(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { userPayload, workerPayload } = normalizePayload(req.body || {}, "create");

    const user = await User.create(
      {
        phone: userPayload.phone,
        firebaseUid: userPayload.firebaseUid ?? null,
        name: userPayload.name ?? null,
        email: userPayload.email ?? null,
        passwordHash: userPayload.passwordHash ?? null,
        age: userPayload.age ?? null,
        lastLoginAt: userPayload.lastLoginAt ?? new Date(),
      },
      { transaction },
    );

    await WorkerProfile.create(
      {
        userId: user.id,
        ...workerPayload,
      },
      { transaction },
    );

    await transaction.commit();

    const createdUser = await User.findByPk(user.id, {
      include: [{ model: WorkerProfile, as: "workerProfile" }],
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: formatUser(createdUser),
    });
  } catch (error) {
    await transaction.rollback();
    const mapped = mapSequelizeError(error);
    return res.status(getStatusCode(mapped)).json({
      success: false,
      message: mapped.message || "Failed to create user.",
    });
  }
}

export async function updateUser(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const user = await User.findByPk(id, {
      include: [{ model: WorkerProfile, as: "workerProfile" }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { userPayload, workerPayload } = normalizePayload(req.body || {}, "update");
    const hasUserUpdates = Object.keys(userPayload).length > 0;
    const hasWorkerUpdates = Object.keys(workerPayload).length > 0;

    if (!hasUserUpdates && !hasWorkerUpdates) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "No fields provided for update.",
      });
    }

    if (hasUserUpdates) {
      await user.update(userPayload, { transaction });
    }

    if (hasWorkerUpdates) {
      if (user.workerProfile) {
        await user.workerProfile.update(workerPayload, { transaction });
      } else {
        await WorkerProfile.create(
          {
            userId: user.id,
            ...workerPayload,
          },
          { transaction },
        );
      }
    }

    await transaction.commit();

    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: WorkerProfile, as: "workerProfile" }],
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: formatUser(updatedUser),
    });
  } catch (error) {
    await transaction.rollback();
    const mapped = mapSequelizeError(error);
    return res.status(getStatusCode(mapped)).json({
      success: false,
      message: mapped.message || "Failed to update user.",
    });
  }
}

export async function deleteUser(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const user = await User.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await user.destroy({ transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    await transaction.rollback();
    const mapped = mapSequelizeError(error);
    return res.status(getStatusCode(mapped)).json({
      success: false,
      message: mapped.message || "Failed to delete user.",
    });
  }
}
