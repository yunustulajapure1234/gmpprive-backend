const express = require("express");
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingStats,
  updateBookingStatus,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/auth");

/* ================= PUBLIC ================= */

router.post("/", createBooking);

/* ================= ADMIN ================= */

router.get("/", protect, getAllBookings);

router.get("/stats", protect, getBookingStats);

router.put("/:id/status", protect, updateBookingStatus);

module.exports = router;
