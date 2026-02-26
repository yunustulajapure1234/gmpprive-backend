const mongoose = require("mongoose");

/* =============================================
   📦 INVENTORY MODEL
   UAE Home Salon - GMP Privé
   Tracks: Products, Stock, Low Stock Alerts
   ============================================= */

// ── Stock Movement Log (embedded) ──────────────────
const stockMovementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["purchase", "usage", "adjustment", "return", "expired"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true, // positive = stock in, negative = stock out
    },
    reason: {
      type: String,
      trim: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    stockBefore: Number,
    stockAfter: Number,
  },
  { timestamps: true }
);

// ── Main Inventory Schema ───────────────────────────
const inventorySchema = new mongoose.Schema(
  {
    // 📝 Basic Info
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    nameAr: {
      type: String,
      trim: true,
    },

    // 🏷️ Category (e.g., Hair, Skin, Nail, Waxing, General)
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Hair Care",
        "Skin Care",
        "Nail Care",
        "Waxing & Threading",
        "Massage Oils",
        "Grooming",
        "Equipment",
        "Disposables",
        "Other",
      ],
    },

    // 👥 Applicable for (can be used for both)
    gender: {
      type: String,
      enum: ["women", "men", "both"],
      default: "both",
    },

    // 📏 Unit of measurement
    unit: {
      type: String,
      enum: ["ml", "g", "piece", "bottle", "box", "pack", "litre", "kg"],
      required: [true, "Unit is required"],
    },

    // 🔢 Stock
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    // ⚠️ Low stock threshold - alert when below this
    lowStockThreshold: {
      type: Number,
      required: true,
      default: 10,
    },

    // 💰 Cost per unit (for purchase tracking)
    costPerUnit: {
      type: Number,
      default: 0,
    },

    // 🏪 Supplier info
    supplier: {
      name: { type: String, trim: true },
      contact: { type: String, trim: true },
    },

    // 🔗 Services that use this product (for auto deduction)
    linkedServices: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
        serviceName: String,
        // How much of this product is used per booking of this service
        usagePerSession: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],

    // 📝 Notes
    notes: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 📊 Stock Movement History
    stockMovements: [stockMovementSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

/* ──────────────────────────────────────────────────────
   🔔 VIRTUAL: isLowStock
   Returns true if currentStock <= lowStockThreshold
────────────────────────────────────────────────────── */
inventorySchema.virtual("isLowStock").get(function () {
  return this.currentStock <= this.lowStockThreshold;
});

inventorySchema.set("toJSON", { virtuals: true });
inventorySchema.set("toObject", { virtuals: true });

/* ──────────────────────────────────────────────────────
   📦 METHOD: addStock (Purchase / Return)
────────────────────────────────────────────────────── */
inventorySchema.methods.addStock = async function (
  quantity,
  reason,
  adminId,
  type = "purchase"
) {
  const stockBefore = this.currentStock;
  this.currentStock += quantity;

  this.stockMovements.push({
    type,
    quantity: +quantity,
    reason,
    performedBy: adminId,
    stockBefore,
    stockAfter: this.currentStock,
  });

  return this.save();
};

/* ──────────────────────────────────────────────────────
   📦 METHOD: deductStock (Usage / Booking)
────────────────────────────────────────────────────── */
inventorySchema.methods.deductStock = async function (
  quantity,
  reason,
  adminId,
  bookingId = null,
  type = "usage"
) {
  if (this.currentStock < quantity) {
    throw new Error(
      `Insufficient stock for "${this.name}". Available: ${this.currentStock}, Required: ${quantity}`
    );
  }

  const stockBefore = this.currentStock;
  this.currentStock -= quantity;

  this.stockMovements.push({
    type,
    quantity: -quantity,
    reason,
    bookingId,
    performedBy: adminId,
    stockBefore,
    stockAfter: this.currentStock,
  });

  return this.save();
};

/* ──────────────────────────────────────────────────────
   🔍 INDEX for fast queries
────────────────────────────────────────────────────── */
inventorySchema.index({ category: 1 });
inventorySchema.index({ currentStock: 1, lowStockThreshold: 1 });
inventorySchema.index({ "linkedServices.serviceId": 1 });

module.exports = mongoose.model("Inventory", inventorySchema);