const mongoose = require("mongoose");

/* =============================================
   📋 ATTENDANCE MODEL
   GMP Privé - UAE Home Salon
   Daily attendance record per staff member
   ============================================= */

const attendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    staffName: {
      type: String,
      required: true,
    },

    // Date only (YYYY-MM-DD) — one record per staff per day
    date: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "half-day", "leave"],
      required: true,
    },

    // Check-in / check-out time (optional)
    checkIn:  { type: String, default: null },
    checkOut: { type: String, default: null },

    // Bookings handled this day (auto-filled)
    bookingsHandled: [
      {
        bookingId:     { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        bookingNumber: String,
        customerName:  String,
        amount:        Number,
        time:          String,
      },
    ],

    // Total earnings for the day (from completed bookings)
    totalEarnings: { type: Number, default: 0 },

    notes: { type: String, trim: true },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// ── One record per staff per day ─────────────────────────
attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);