const mongoose = require("mongoose");

/* =============================================
   💎 MEMBERSHIP PLAN MODEL
   GMP Privé - UAE Home Salon
   Stores the plan templates (Tier 1, Tier 2 etc.)
   ============================================= */
const membershipPlanSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },  // "Tier 1 – Privé Monthly Groom & Glow"
  tier:              { type: Number, required: true },               // 1, 2, 3...
  monthlyFee:        { type: Number, required: true },               // 399
  retailValue:       { type: Number, default: 0    },               // 500
  additionalDiscount:{ type: Number, default: 0    },               // 10 (percentage)
  description:       { type: String, default: ""   },               // short description
  includedServices:  { type: String, default: ""   },               // full text from Excel
  subOptions: [{                                                     // a, b, c sub-plans
    label:    { type: String },   // "a", "b", "c"
    title:    { type: String },   // "BASIC RELAX & GROOM PACKAGE"
    services: { type: String },   // services text
    value:    { type: Number },   // total value of this sub-plan
  }],
  color:    { type: String, default: "#f59e0b" }, // display color
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("MembershipPlan", membershipPlanSchema);