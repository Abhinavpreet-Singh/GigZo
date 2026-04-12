import { DataTypes } from "sequelize";
import sequelize from "../../db/index.js";

const Policy = sequelize.define(
  "Policy",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    planName: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    weeklyPremium: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    coveragePerDay: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    zone: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    triggers: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "cancelled"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    timestamps: true,
    tableName: "policies",
    underscored: false,
  },
);

export default Policy;
