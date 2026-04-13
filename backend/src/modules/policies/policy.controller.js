import {
  getAvailablePlans,
  createPolicyCheckoutForUser,
  confirmPolicyPurchaseForUser,
  getCurrentPolicyForUser,
  renewPolicyForUser,
  cancelPolicyForUser,
  formatPolicyServiceError,
} from "./policy.service.js";

export async function getPolicyPlansController(_req, res) {
  try {
    const plans = getAvailablePlans();

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    const failure = formatPolicyServiceError(error);
    return res.status(failure.statusCode).json({
      success: false,
      message: failure.message,
    });
  }
}

export async function createPolicyOrderController(req, res) {
  try {
    const order = await createPolicyCheckoutForUser(req.user.userId, req.body || {});

    return res.status(200).json({
      success: true,
      message: "Checkout order created successfully.",
      data: order,
    });
  } catch (error) {
    const failure = formatPolicyServiceError(error);
    return res.status(failure.statusCode).json({
      success: false,
      message: failure.message,
    });
  }
}

export async function purchasePolicyController(req, res) {
  try {
    const policy = await confirmPolicyPurchaseForUser(req.user.userId, req.body || {});

    return res.status(201).json({
      success: true,
      message: "Policy purchased successfully.",
      data: policy,
    });
  } catch (error) {
    const failure = formatPolicyServiceError(error);
    return res.status(failure.statusCode).json({
      success: false,
      message: failure.message,
    });
  }
}

export async function getMyPolicyController(req, res) {
  try {
    const policy = await getCurrentPolicyForUser(req.user.userId);

    return res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    const failure = formatPolicyServiceError(error);
    return res.status(failure.statusCode).json({
      success: false,
      message: failure.message,
    });
  }
}

export async function renewPolicyController(req, res) {
  try {
    const policy = await renewPolicyForUser(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Policy renewed successfully.",
      data: policy,
    });
  } catch (error) {
    const failure = formatPolicyServiceError(error);
    return res.status(failure.statusCode).json({
      success: false,
      message: failure.message,
    });
  }
}

export async function cancelPolicyController(req, res) {
  try {
    const policy = await cancelPolicyForUser(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Policy cancelled successfully.",
      data: policy,
    });
  } catch (error) {
    const failure = formatPolicyServiceError(error);
    return res.status(failure.statusCode).json({
      success: false,
      message: failure.message,
    });
  }
}
