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