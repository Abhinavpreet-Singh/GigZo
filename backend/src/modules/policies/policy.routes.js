import express from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  getPolicyPlansController,
  createPolicyCheckoutController,
  purchasePolicyController,
  getMyPolicyController,
  renewPolicyController,
  cancelPolicyController,
} from "./policy.controller.js";

const router = express.Router();

router.get("/plans", requireAuth, getPolicyPlansController);
router.post("/checkout/order", requireAuth, createPolicyCheckoutController);
router.post("/purchase", requireAuth, purchasePolicyController);
router.get("/my-policy", requireAuth, getMyPolicyController);
router.post("/renew", requireAuth, renewPolicyController);
router.post("/cancel", requireAuth, cancelPolicyController);

export default router;
