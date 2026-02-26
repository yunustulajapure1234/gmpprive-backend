const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    customerName:  { type: String, required: true },
    phone:         { type: String, required: true },

    services: [
      {
        itemId:       { type: mongoose.Schema.Types.ObjectId, required: true },
        type:         { type: String, enum: ["service", "package"], required: true },
        name:         { type: String, required: true },
        nameAr:       String,
        price:        { type: Number, required: true },
        quantity:     { type: Number, default: 1 },
        duration:     Number,
        packageItems: [String],
      },
    ],

    totalAmount: { type: Number, required: true },
    date:        { type: Date,   required: true },
    time:        { type: String, required: true },

    address: {
      building:  String,
      apartment: String,
      area:      String,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"],
      default: "pending",
    },

    /* ── ✅ Staff Assignment ── */
    assignedStaff:     { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    assignedStaffName: { type: String, default: null },
    assignedAt:        { type: Date,   default: null },

    whatsappSent:   { type: Boolean, default: false },
    whatsappSentAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);