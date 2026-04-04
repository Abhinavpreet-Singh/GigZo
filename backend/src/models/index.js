import User from "./user.model.js";
import WorkerProfile from "./workerProfile.model.js";
import Policy from "../modules/policies/policy.model.js";

// Define associations
User.hasOne(WorkerProfile, {
  foreignKey: "userId",
  as: "workerProfile",
});

WorkerProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Policy, {
  foreignKey: "userId",
  as: "policies",
});

Policy.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

export { User, WorkerProfile, Policy };
