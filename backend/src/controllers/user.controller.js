import { prisma } from "../db/index.js";
import {
  formatUserProfile,
  splitProfilePayload,
} from "../utils/profile.mapper.js";

async function loadUserProfile(userId) {
  const id = Number(userId);
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });

  if (!user) {
    return null;
  }

  return formatUserProfile(user, user.profile || {});
}

function getStatusCode(error) {
  return Number(error?.statusCode) || 500;
}

export const getMyProfile = async (req, res) => {
  try {
    const userProfile = await loadUserProfile(req.user.userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Failed to load profile.",
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const id = Number(req.user.userId);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { userPatch, profilePatch } = splitProfilePayload(req.body || {});

    if (!Object.keys(userPatch).length && !Object.keys(profilePatch).length) {
      return res.status(400).json({
        success: false,
        message: "No profile fields provided.",
      });
    }

    if (Object.keys(userPatch).length) {
      await prisma.user.update({
        where: { id },
        data: userPatch,
      });
    }

    if (Object.keys(profilePatch).length) {
      await prisma.workerProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          ...profilePatch,
        },
        update: profilePatch,
      });
    }

    const updatedProfile = await loadUserProfile(id);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};
