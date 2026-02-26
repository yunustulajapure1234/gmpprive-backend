const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  addStock,
  deductStock,
  getLowStockAlerts,
  getInventoryStats,
  getStockHistory,
  linkService,
  unlinkService,
} = require("../controllers/inventoryController");

const { protect, authorize } = require("../middleware/auth");

// All inventory routes are protected (admin only)
router.use(protect);

/* ─────────────────────────────────────────────
   📊 DASHBOARD & ALERTS (before /:id routes)
───────────────────────────────────────────── */
router.get("/stats", getInventoryStats);
router.get("/low-stock", getLowStockAlerts);

/* ─────────────────────────────────────────────
   📦 PRODUCT CRUD
───────────────────────────────────────────── */
router.get("/", getAllProducts);
router.post("/", createProduct);

router.get("/:id", getProduct);
router.put("/:id", updateProduct);
router.delete("/:id", authorize("super-admin"), deleteProduct);

/* ─────────────────────────────────────────────
   📈 STOCK MANAGEMENT
───────────────────────────────────────────── */
router.post("/:id/add-stock", addStock);
router.post("/:id/deduct-stock", deductStock);
router.get("/:id/history", getStockHistory);

/* ─────────────────────────────────────────────
   🔗 SERVICE LINKING
───────────────────────────────────────────── */
router.post("/:id/link-service", linkService);
router.delete("/:id/unlink-service/:serviceId", unlinkService);

module.exports = router;