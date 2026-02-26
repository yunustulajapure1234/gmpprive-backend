const Inventory = require("../models/Inventory");
const Booking = require("../models/Booking");

/* =============================================
   📦 INVENTORY CONTROLLER
   GMP Privé - UAE Home Salon
   ============================================= */

/* ─────────────────────────────────────────────
   ➕ CREATE PRODUCT
   POST /api/inventory
───────────────────────────────────────────── */
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Inventory.create({
      ...req.body,
      createdBy: req.admin._id,
    });

    res.status(201).json({
      success: true,
      message: "Product added to inventory",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   📋 GET ALL PRODUCTS
   GET /api/inventory
   Query: ?category=Hair Care&gender=women&lowStock=true&search=shampoo
───────────────────────────────────────────── */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, gender, lowStock, search, isActive } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (gender) filter.gender = { $in: [gender, "both"] };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Search by name
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { nameAr: { $regex: search, $options: "i" } },
      ];
    }

    let products = await Inventory.find(filter)
      .select("-stockMovements") // exclude history for list view (heavy)
      .populate("linkedServices.serviceId", "name gender")
      .sort({ createdAt: -1 });

    // Filter low stock (virtual field - do it after fetch)
    if (lowStock === "true") {
      products = products.filter(
        (p) => p.currentStock <= p.lowStockThreshold
      );
    }

    // Summary counts
    const totalProducts = products.length;
    const lowStockCount = products.filter(
      (p) => p.currentStock <= p.lowStockThreshold
    ).length;
    const outOfStockCount = products.filter(
      (p) => p.currentStock === 0
    ).length;

    res.status(200).json({
      success: true,
      summary: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
      },
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   🔍 GET SINGLE PRODUCT (with full history)
   GET /api/inventory/:id
───────────────────────────────────────────── */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Inventory.findById(req.params.id)
      .populate("linkedServices.serviceId", "name gender category")
      .populate("stockMovements.performedBy", "name")
      .populate("stockMovements.bookingId", "bookingNumber customerName");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   ✏️ UPDATE PRODUCT
   PUT /api/inventory/:id
───────────────────────────────────────────── */
exports.updateProduct = async (req, res, next) => {
  try {
    // Don't allow direct stock update through this route
    const { currentStock, stockMovements, ...updateData } = req.body;

    const product = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   🗑️ DELETE PRODUCT
   DELETE /api/inventory/:id
───────────────────────────────────────────── */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Inventory.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted from inventory",
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   📦 ADD STOCK (Purchase / Restock)
   POST /api/inventory/:id/add-stock
   Body: { quantity, reason }
───────────────────────────────────────────── */
exports.addStock = async (req, res, next) => {
  try {
    const { quantity, reason } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid quantity greater than 0",
      });
    }

    const product = await Inventory.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.addStock(
      Number(quantity),
      reason || "Manual stock addition",
      req.admin._id,
      "purchase"
    );

    res.status(200).json({
      success: true,
      message: `Stock updated. New stock: ${product.currentStock} ${product.unit}`,
      data: {
        productId: product._id,
        name: product.name,
        currentStock: product.currentStock,
        unit: product.unit,
        isLowStock: product.isLowStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   📉 DEDUCT STOCK (Manual Usage / Adjustment)
   POST /api/inventory/:id/deduct-stock
   Body: { quantity, reason, type }
───────────────────────────────────────────── */
exports.deductStock = async (req, res, next) => {
  try {
    const { quantity, reason, type = "usage" } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid quantity greater than 0",
      });
    }

    const product = await Inventory.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deductStock(
      Number(quantity),
      reason || "Manual stock deduction",
      req.admin._id,
      null,
      type
    );

    const response = {
      success: true,
      message: `Stock deducted. Remaining: ${product.currentStock} ${product.unit}`,
      data: {
        productId: product._id,
        name: product.name,
        currentStock: product.currentStock,
        unit: product.unit,
        isLowStock: product.isLowStock,
      },
    };

    // ⚠️ Low stock warning in response
    if (product.isLowStock) {
      response.warning = `⚠️ Low stock alert! "${product.name}" has only ${product.currentStock} ${product.unit} left (threshold: ${product.lowStockThreshold})`;
    }

    res.status(200).json(response);
  } catch (error) {
    // Insufficient stock error
    if (error.message.includes("Insufficient stock")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/* ─────────────────────────────────────────────
   🔗 AUTO DEDUCT STOCK WHEN BOOKING COMPLETED
   POST /api/inventory/auto-deduct/:bookingId
   Called internally when booking status → completed
───────────────────────────────────────────── */
exports.autoDeductForBooking = async (bookingId, adminId) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return { success: false, message: "Booking not found" };

    const results = [];
    const warnings = [];

    // Loop through each service in the booking
    for (const bookedItem of booking.services) {
      // Find inventory products linked to this service
      const linkedProducts = await Inventory.find({
        "linkedServices.serviceId": bookedItem.itemId,
        isActive: true,
      });

      for (const product of linkedProducts) {
        // Find usage config for this specific service
        const linkConfig = product.linkedServices.find(
          (l) => l.serviceId.toString() === bookedItem.itemId.toString()
        );

        if (!linkConfig) continue;

        const totalUsage = linkConfig.usagePerSession * (bookedItem.quantity || 1);

        try {
          await product.deductStock(
            totalUsage,
            `Auto deduct - Booking #${booking.bookingNumber}`,
            adminId,
            bookingId,
            "usage"
          );

          results.push({
            product: product.name,
            deducted: totalUsage,
            remaining: product.currentStock,
            unit: product.unit,
          });

          // ⚠️ Collect low stock warnings
          if (product.isLowStock) {
            warnings.push(
              `⚠️ "${product.name}" is low on stock: ${product.currentStock} ${product.unit} remaining`
            );
          }
        } catch (err) {
          // If insufficient stock - log but don't block booking completion
          results.push({
            product: product.name,
            error: err.message,
            skipped: true,
          });
        }
      }
    }

    return { success: true, results, warnings };
  } catch (error) {
    console.error("Auto deduct error:", error);
    return { success: false, error: error.message };
  }
};

/* ─────────────────────────────────────────────
   ⚠️ GET LOW STOCK ALERTS
   GET /api/inventory/low-stock
───────────────────────────────────────────── */
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    // Fetch all active products and filter by virtual isLowStock
    const allProducts = await Inventory.find({ isActive: true }).select(
      "name nameAr category currentStock lowStockThreshold unit supplier"
    );

    const lowStockProducts = allProducts.filter(
      (p) => p.currentStock <= p.lowStockThreshold
    );

    const outOfStock = lowStockProducts.filter((p) => p.currentStock === 0);
    const critical = lowStockProducts.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.lowStockThreshold / 2
    );
    const low = lowStockProducts.filter(
      (p) => p.currentStock > p.lowStockThreshold / 2 && p.currentStock <= p.lowStockThreshold
    );

    res.status(200).json({
      success: true,
      summary: {
        totalAlerts: lowStockProducts.length,
        outOfStock: outOfStock.length,
        critical: critical.length,
        low: low.length,
      },
      data: {
        outOfStock,
        critical,
        low,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   📊 INVENTORY STATS / DASHBOARD SUMMARY
   GET /api/inventory/stats
───────────────────────────────────────────── */
exports.getInventoryStats = async (req, res, next) => {
  try {
    const allProducts = await Inventory.find({ isActive: true });

    const totalProducts = allProducts.length;
    const totalStockValue = allProducts.reduce(
      (acc, p) => acc + p.currentStock * p.costPerUnit,
      0
    );
    const lowStockCount = allProducts.filter(
      (p) => p.currentStock <= p.lowStockThreshold
    ).length;
    const outOfStockCount = allProducts.filter(
      (p) => p.currentStock === 0
    ).length;

    // Group by category
    const byCategory = {};
    allProducts.forEach((p) => {
      if (!byCategory[p.category]) {
        byCategory[p.category] = { count: 0, lowStock: 0 };
      }
      byCategory[p.category].count++;
      if (p.currentStock <= p.lowStockThreshold) {
        byCategory[p.category].lowStock++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        lowStockCount,
        outOfStockCount,
        byCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   📜 GET STOCK MOVEMENT HISTORY
   GET /api/inventory/:id/history
   Query: ?type=usage&limit=20
───────────────────────────────────────────── */
exports.getStockHistory = async (req, res, next) => {
  try {
    const { type, limit = 50 } = req.query;

    const product = await Inventory.findById(req.params.id)
      .populate("stockMovements.performedBy", "name")
      .populate("stockMovements.bookingId", "bookingNumber customerName date");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let history = product.stockMovements;

    // Filter by type if provided
    if (type) {
      history = history.filter((m) => m.type === type);
    }

    // Sort latest first and limit
    history = history
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit));

    res.status(200).json({
      success: true,
      product: {
        name: product.name,
        currentStock: product.currentStock,
        unit: product.unit,
      },
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   🔗 LINK/UNLINK SERVICE TO PRODUCT
   POST /api/inventory/:id/link-service
   Body: { serviceId, serviceName, usagePerSession }
───────────────────────────────────────────── */
exports.linkService = async (req, res, next) => {
  try {
    const { serviceId, serviceName, usagePerSession } = req.body;

    const product = await Inventory.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if already linked
    const alreadyLinked = product.linkedServices.find(
      (l) => l.serviceId.toString() === serviceId
    );

    if (alreadyLinked) {
      // Update usage
      alreadyLinked.usagePerSession = usagePerSession || alreadyLinked.usagePerSession;
      alreadyLinked.serviceName = serviceName || alreadyLinked.serviceName;
    } else {
      product.linkedServices.push({ serviceId, serviceName, usagePerSession: usagePerSession || 1 });
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: alreadyLinked ? "Service link updated" : "Service linked to product",
      data: product.linkedServices,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   🔗 UNLINK SERVICE FROM PRODUCT
   DELETE /api/inventory/:id/unlink-service/:serviceId
───────────────────────────────────────────── */
exports.unlinkService = async (req, res, next) => {
  try {
    const product = await Inventory.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.linkedServices = product.linkedServices.filter(
      (l) => l.serviceId.toString() !== req.params.serviceId
    );

    await product.save();

    res.status(200).json({
      success: true,
      message: "Service unlinked from product",
      data: product.linkedServices,
    });
  } catch (error) {
    next(error);
  }
};