<<<<<<< HEAD
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: null,
      trim: true,
    },
    platform: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      default: null,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
=======
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  personalDetails: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    }
  },

  platformDetails: {
    platform: {
      type: String,
      enum: ["Zomato", "Swiggy"],
      required: true
    },
    workerId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["full-time", "part-time"],
      required: true
    }
  },

  locationDetails: {
    city: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    workingArea: {
      type: String,
      required: true
    }
  },

  workDetails: {
    workingHoursPerDay: {
      type: Number,
      required: true
    }
  },

  earningDetails: {
    avgDailyEarning: {
      type: Number
    }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
>>>>>>> e4d510c (Implement user profile module with schema, controller, and routes)
