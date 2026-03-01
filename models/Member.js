const mongoose = require("mongoose");

/* =============================================
   👤 MEMBER MODEL
   GMP Privé - Customer Membership Subscriptions
   ============================================= */
const memberSchema = new mongoose.Schema({
  // Customer info
  customerName: { type: String, required: true, trim: true },
  phone:        { type: String, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  emiratesId:   { type: String, trim: true },  // optional
  notes:        { type: String, default: "" },

  // Plan reference
  plan:         { type: mongoose.Schema.Types.ObjectId, ref: "MembershipPlan", required: true },
  planName:     { type: String },   // snapshot at time of joining
  planTier:     { type: Number },
  subOptionLabel: { type: String }, // which sub-option (a/b/c) they chose

  // Dates
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },  // auto = startDate + 1 month

  // Billing
  monthlyFee:   { type: Number },
  paidAmount:   { type: Number, default: 0 },
  paymentStatus:{ type: String, enum: ["paid","partial","pending","overdue"], default: "pending" },
  paymentMethod:{ type: String, enum: ["cash","card","bank","online","other"], default: "cash" },

  // Status
  status: {
    type: String,
    enum: ["active","expired","cancelled","paused"],
    default: "active",
  },

  // Auto renewal
  autoRenew: { type: Boolean, default: false },

  // Renewal history
  renewals: [{
    renewedAt:    Date,
    newStartDate: Date,
    newEndDate:   Date,
    paidAmount:   Number,
    paymentMethod:String,
    note:         String,
    renewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  }],

  // Services used tracking
  servicesUsed: [{
    date:        Date,
    description: String,
    amount:      Number,
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

/* Auto-set endDate = startDate + 1 month */
memberSchema.pre("save", function(next) {
  if (this.isNew && this.startDate && !this.endDate) {
    const end = new Date(this.startDate);
    end.setMonth(end.getMonth() + 1);
    this.endDate = end;
  }
  next();
});

/* Virtual: days left */
memberSchema.virtual("daysLeft").get(function() {
  const now = new Date();
  const diff = Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24));
  return diff;
});

/* Virtual: computed status based on dates */
memberSchema.virtual("computedStatus").get(function() {
  if (this.status === "cancelled") return "cancelled";
  if (this.status === "paused")    return "paused";
  const now = new Date();
  if (now > this.endDate) return "expired";
  return "active";
});

memberSchema.set("toJSON",   { virtuals: true });
memberSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Member", memberSchema);