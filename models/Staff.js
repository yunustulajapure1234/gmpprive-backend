const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
    },

    phone: { type: String, trim: true },

    specialization: {
      type: [String],
      enum: ["Hair", "Skin", "Nails", "Waxing", "Massage", "Grooming", "Makeup"],
      default: [],
    },

    servicesFor: {
      type: String,
      enum: ["women", "men", "both"],
      default: "both",
    },

    /* ── Availability (auto from bookings) ── */
    isAvailable: { type: Boolean, default: true },
    isActive:    { type: Boolean, default: true },

    notes: { type: String, trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);