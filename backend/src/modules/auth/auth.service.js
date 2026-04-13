import jwt from "jsonwebtoken";
import { prisma } from "../../db/index.js";
import { verifyFirebaseIdToken } from "../../config/firebase.js";
import { formatUserProfile } from "../../utils/profile.mapper.js";

function normalizeIndianPhone(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return null;
  }

  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  return null;
}

function getUserIdentifiers(decodedToken) {
  const normalizedPhone = normalizeIndianPhone(decodedToken.phone_number);
  const email =
    decodedToken.email && typeof decodedToken.email === "string"
      ? decodedToken.email.toLowerCase()
      : null;

  return {
    phone: normalizedPhone || (email ? `email:${email}` : null),
    email,
  };
}

export async function loginWithFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    const error = new Error("Firebase idToken is required.");
    error.statusCode = 400;
    throw error;
  }

  const decoded = await verifyFirebaseIdToken(idToken);
  const firebaseUid = decoded.uid;
  const { phone: userPhone, email: userEmail } = getUserIdentifiers(decoded);

  if (!userPhone) {
    const error = new Error(
      "Phone number or email is missing in Firebase token.",
    );
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    let user = await tx.user.findFirst({
      where: {
        OR: [
          { firebaseUid },
          { phone: userPhone },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          firebaseUid,
          phone: userPhone,
          email: userEmail,
          name: decoded.name || null,
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await tx.user.update({
        where: { id: user.id },
        data: {
          firebaseUid,
          phone: userPhone,
          email: user.email || userEmail,
          name: user.name || decoded.name || null,
          lastLoginAt: new Date(),
        },
      });
    }

    const profile = await tx.workerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    return { user, profile };
  });

  const accessToken = jwt.sign(
    {
      userId: String(result.user.id),
      phone: result.user.phone,
      firebaseUid: result.user.firebaseUid,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

  return {
    accessToken,
    user: formatUserProfile(result.user, result.profile),
  };
}

export async function getProfileByUserId(userId) {
  const id = Number(userId);
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return formatUserProfile(user, user.profile || {});
}
