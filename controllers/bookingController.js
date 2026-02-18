const Booking = require("../models/Booking");


/* ================= CREATE BOOKING ================= */

exports.createBooking = async (req, res, next) => {
  try {

    const bookingNumber = "BK" + Date.now();

    // ✅ FIX: Convert duration to Number
    const formattedServices = req.body.services.map(service => ({
      ...service,
      duration: service.duration
        ? parseInt(service.duration)
        : 0
    }));

    const booking = await Booking.create({
      ...req.body,
      services: formattedServices, // 👈 IMPORTANT
      bookingNumber,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });

  } catch (error) {
    next(error);
  }
};



/* ================= GET ALL BOOKINGS ================= */

exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/* ================= UPDATE BOOKING STATUS ================= */

/* ================= UPDATE BOOKING STATUS ================= */

// exports.updateBookingStatus = async (req, res, next) => {
//   try {
//     const { status } = req.body;

//     const booking = await Booking.findById(req.params.id);

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     booking.status = status;
//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: "Status updated successfully",
//       data: booking,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

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

    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const yearStart = new Date(now.getFullYear(), 0, 1);

    const totalBookings = await Booking.countDocuments();

    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: todayStart },
    });

    const weeklyBookings = await Booking.countDocuments({
      createdAt: { $gte: weekStart },
    });

    const monthlyBookings = await Booking.countDocuments({
      createdAt: { $gte: monthStart },
    });

    const yearlyBookings = await Booking.countDocuments({
      createdAt: { $gte: yearStart },
    });

    const revenue = await Booking.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        todayBookings,
        weeklyBookings,
        monthlyBookings,
        yearlyBookings,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ================= DELETE BOOKING ================= */

exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
