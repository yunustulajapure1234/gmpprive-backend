const express = require("express");
const router  = express.Router();
const {
  createStaff,
  getAllStaff,
  getStaff,
  updateStaff,
  deleteStaff,
  assignStaffToBooking,
  unassignStaff,
  markAttendance,
  getMonthlyReport,
  getAttendanceByDate,
  getStaffBookings,
  createManualBooking,
  getManualBookings,
  deleteManualBooking,
} = require("../controllers/staffController");

const { protect, authorize } = require("../middleware/auth");

router.use(protect);

/* ── ✅ SPECIFIC ROUTES FIRST (/:id se pehle) ── */
router.get("/attendance",            getAttendanceByDate);
router.post("/attendance",           markAttendance);
router.get("/report/monthly",        getMonthlyReport);

/* ── Manual Bookings ── */
router.get("/manual-bookings",       getManualBookings);
router.post("/manual-booking",       createManualBooking);
router.delete("/manual-booking/:id", deleteManualBooking);

/* ── Assignment ── */
router.put("/assign/:bookingId",     assignStaffToBooking);
router.put("/unassign/:bookingId",   unassignStaff);

/* ── CRUD (/:id routes LAST) ── */
router.get("/",    getAllStaff);
router.post("/",   createStaff);

router.get("/:id",          getStaff);
router.put("/:id",          updateStaff);
router.delete("/:id",       authorize("super-admin"), deleteStaff);
router.get("/:id/bookings", getStaffBookings);

module.exports = router;