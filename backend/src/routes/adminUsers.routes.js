import express from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../controllers/adminUsers.controller.js";

const router = express.Router();

router.get("/", listUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
