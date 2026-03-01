const express = require("express");
const router  = express.Router();
const {
  getPlans, getPlan, createPlan, updatePlan, deletePlan,
  getMembers, getMember, createMember, updateMember, deleteMember,
  renewMember, syncExpiredStatus, getMembershipStats,
} = require("../controllers/membershipController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

/* ── Plans ── */
router.get("/plans",              getPlans);
router.post("/plans",             createPlan);
router.get("/plans/:id",          getPlan);
router.put("/plans/:id",          updatePlan);
router.delete("/plans/:id",       authorize("super-admin"), deletePlan);

/* ── Stats ── */
router.get("/stats",              getMembershipStats);
router.post("/sync-expired",      syncExpiredStatus);

/* ── Members ── */
router.get("/",                   getMembers);
router.post("/",                  createMember);
router.get("/:id",                getMember);
router.put("/:id",                updateMember);
router.delete("/:id",             deleteMember);
router.post("/:id/renew",         renewMember);

module.exports = router;