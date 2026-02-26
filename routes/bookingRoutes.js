const express = require("express");
const router  = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingStats,
  updateBookingStatus,
  deleteBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/auth");

/* ── PUBLIC ── */
router.post("/", createBooking);

/* ── ADMIN ── */
router.get("/",          protect, getAllBookings);
router.get("/stats",     protect, getBookingStats);
router.put("/:id/status", protect, updateBookingStatus);
router.delete("/:id",    protect, deleteBooking);

module.exports = router;