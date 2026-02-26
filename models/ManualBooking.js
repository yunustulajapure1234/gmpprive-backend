const mongoose = require("mongoose");

/* =============================================
   📋 MANUAL BOOKING MODEL
   GMP Privé - UAE Home Salon
   For offline/call bookings outside website
   ============================================= */

const manualBookingSchema = new mongoose.Schema(
  {
    // Auto reference number
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Source tag
    source: {
      type: String,
      enum: ["manual", "call", "whatsapp", "walkin"],
      default: "manual",
    },

    customerName: { type: String, required: true, trim: true },
    phone:        { type: String, trim: true },

    date: { type: Date,   required: true },
    time: { type: String, required: true },

    // Free text services description
    servicesText: {
      type: String,
      required: true,
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    // Which staff did this service
    assignedStaff:     { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    assignedStaffName: { type: String, default: null },

    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed", // manual entries are usually already done
    },

    notes: { type: String, trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManualBooking", manualBookingSchema);