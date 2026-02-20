const Booking = require("../models/Booking");


/* ================= CREATE BOOKING ================= */

exports.createBooking = async (req, res, next) => {
  try {
    const bookingNumber = `BK${Date.now()}`;

    const formattedServices = (req.body.services || []).map(service => ({
      itemId: service.itemId,
      type: service.type || "service",
      name: service.name,
      nameAr: service.nameAr || "",
      price: Number(service.price) || 0,
      quantity: Number(service.quantity) || 1,
      duration: isNaN(Number(service.duration)) ? 0 : Number(service.duration) || 0,
      packageItems: service.packageItems || [],
    }));

    const booking = await Booking.create({
      customerName: req.body.customerName,
      phone: req.body.phone,
      date: req.body.date,
      time: req.body.time,
      address: req.body.address,
      services: formattedServices,
      totalAmount: Number(req.body.totalAmount) || 0,
      bookingNumber,
    });

    return res.status(201).json({
      success: true,
      data: booking,
    });

  } catch (error) {
    next(error);
  }
};




/* ================= GET ALL BOOKINGS ================= */

exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
  .sort({ createdAt: -1 })
  .lean();


    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/* ================= UPDATE BOOKING STATUS ================= */

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });

  } catch (error) {
    next(error);
  }
};

/* ================= BOOKING STATS ================= */

exports.getBookingStats = async (req, res, next) => {
  try {
    const now = new Date();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalBookings,
      todayBookings,
      weeklyBookings,
      monthlyBookings,
      yearlyBookings,
      revenueResult
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: todayStart } }),
      Booking.countDocuments({ createdAt: { $gte: weekStart } }),
      Booking.countDocuments({ createdAt: { $gte: monthStart } }),
      Booking.countDocuments({ createdAt: { $gte: yearStart } }),
      Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        todayBookings,
        weeklyBookings,
        monthlyBookings,
        yearlyBookings,
        totalRevenue: revenueResult[0]?.total || 0,
      }
    });

  } catch (error) {
    next(error);
  }
};


/* ================= DELETE BOOKING ================= */

exports.deleteBooking = async (req, res, next) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};

