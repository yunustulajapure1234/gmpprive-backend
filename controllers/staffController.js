const Staff         = require("../models/Staff");
const Booking       = require("../models/Booking");
const Attendance    = require("../models/Attendance");
const ManualBooking = require("../models/ManualBooking");

/* ─── CREATE STAFF ─────────────────────────── */
exports.createStaff = async (req, res, next) => {
  try {
    const staff = await Staff.create({ ...req.body, createdBy: req.admin._id });
    res.status(201).json({ success: true, message: "Staff member added", data: staff });
  } catch (error) { next(error); }
};

/* ─── GET ALL STAFF ────────────────────────── */
exports.getAllStaff = async (req, res, next) => {
  try {
    const { specialization, servicesFor, isActive } = req.query;
    const filter = {};
    if (specialization) filter.specialization = { $in: [specialization] };
    if (servicesFor)    filter.servicesFor    = { $in: [servicesFor, "both"] };
    filter.isActive = isActive === "false" ? false : true;

    const allStaff = await Staff.find(filter).sort({ name: 1 });

    const todayStr = new Date().toISOString().split("T")[0];
    const activeBookings = await Booking.find({
      assignedStaff: { $in: allStaff.map((s) => s._id) },
      status:        { $in: ["confirmed", "in-progress"] },
      date: {
        $gte: new Date(todayStr),
        $lt:  new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000),
      },
    }).select("assignedStaff");

    const busyStaffIds = new Set(activeBookings.map((b) => b.assignedStaff.toString()));
    const result = allStaff.map((s) => ({ ...s.toObject(), isAvailable: !busyStaffIds.has(s._id.toString()) }));
    res.status(200).json({ success: true, total: result.length, data: result });
  } catch (error) { next(error); }
};

/* ─── GET SINGLE STAFF ─────────────────────── */
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    res.status(200).json({ success: true, data: staff });
  } catch (error) { next(error); }
};

/* ─── UPDATE STAFF ─────────────────────────── */
exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    res.status(200).json({ success: true, message: "Staff updated", data: staff });
  } catch (error) { next(error); }
};

/* ─── DELETE STAFF ─────────────────────────── */
exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    await staff.deleteOne();
    res.status(200).json({ success: true, message: "Staff removed" });
  } catch (error) { next(error); }
};

/* ─── ASSIGN STAFF TO BOOKING ──────────────── */
exports.assignStaffToBooking = async (req, res, next) => {
  try {
    const { staffId }   = req.body;
    const { bookingId } = req.params;
    const [booking, staff] = await Promise.all([Booking.findById(bookingId), Staff.findById(staffId)]);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (!staff)   return res.status(404).json({ success: false, message: "Staff not found" });

    const conflict = await Booking.findOne({
      _id: { $ne: bookingId }, assignedStaff: staffId,
      date: booking.date, time: booking.time,
      status: { $in: ["confirmed", "in-progress", "pending"] },
    });
    if (conflict) return res.status(400).json({ success: false, message: `${staff.name} already has booking #${conflict.bookingNumber} at this time` });

    booking.assignedStaff     = staffId;
    booking.assignedStaffName = staff.name;
    booking.assignedAt        = new Date();
    await booking.save();

    const dateStr = new Date(booking.date).toISOString().split("T")[0];
    await Attendance.findOneAndUpdate(
      { staff: staffId, date: dateStr },
      { $setOnInsert: { staff: staffId, staffName: staff.name, date: dateStr, status: "present", markedBy: req.admin._id } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: `${staff.name} assigned`, data: booking });
  } catch (error) { next(error); }
};

/* ─── UNASSIGN STAFF ───────────────────────── */
exports.unassignStaff = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    booking.assignedStaff = null; booking.assignedStaffName = null; booking.assignedAt = null;
    await booking.save();
    res.status(200).json({ success: true, message: "Staff unassigned", data: booking });
  } catch (error) { next(error); }
};

/* ─── MARK ATTENDANCE ──────────────────────── */
exports.markAttendance = async (req, res, next) => {
  try {
    const { staffId, date, status, checkIn, checkOut, notes } = req.body;
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    const dayStart = new Date(date);
    const dayEnd   = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000);

    const [websiteBkgs, manualBkgs] = await Promise.all([
      Booking.find({ assignedStaff: staffId, status: "completed", date: { $gte: dayStart, $lt: dayEnd } }),
      ManualBooking.find({ assignedStaff: staffId, status: "completed", date: { $gte: dayStart, $lt: dayEnd } }),
    ]);

    const bookingsHandled = [
      ...websiteBkgs.map((b) => ({ bookingId: b._id, bookingNumber: b.bookingNumber, customerName: b.customerName, amount: b.totalAmount, time: b.time, source: "website" })),
      ...manualBkgs.map((b)  => ({ bookingId: b._id, bookingNumber: b.bookingNumber, customerName: b.customerName, amount: b.totalAmount, time: b.time, source: b.source })),
    ];
    const totalEarnings = bookingsHandled.reduce((s, b) => s + (b.amount || 0), 0);

    const attendance = await Attendance.findOneAndUpdate(
      { staff: staffId, date },
      { staff: staffId, staffName: staff.name, date, status, checkIn: checkIn || null, checkOut: checkOut || null, bookingsHandled, totalEarnings, notes: notes || "", markedBy: req.admin._id },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: "Attendance marked", data: attendance });
  } catch (error) { next(error); }
};

/* ─── GET ATTENDANCE BY DATE ───────────────── */
exports.getAttendanceByDate = async (req, res, next) => {
  try {
    const date     = req.query.date || new Date().toISOString().split("T")[0];
    const allStaff = await Staff.find({ isActive: true });
    const attendance = await Attendance.find({ date });
    const attendanceMap = {};
    attendance.forEach((a) => { attendanceMap[a.staff.toString()] = a; });
    const result = allStaff.map((s) => ({
      staff: s,
      attendance: attendanceMap[s._id.toString()] || null,
      status:     attendanceMap[s._id.toString()]?.status || "not-marked",
    }));
    res.status(200).json({ success: true, date, data: result });
  } catch (error) { next(error); }
};

/* ─── MONTHLY REPORT ───────────────────────── */
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { month, staffId } = req.query;
    if (!month) return res.status(400).json({ success: false, message: "month required (YYYY-MM)" });

    const [year, mon] = month.split("-").map(Number);
    const startDate    = `${month}-01`;
    const lastDay      = new Date(year, mon, 0).getDate();
    const endDate      = `${month}-${String(lastDay).padStart(2, "0")}`;
    const startDateObj = new Date(year, mon - 1, 1);
    const endDateObj   = new Date(year, mon, 1);

    const attendanceFilter = { date: { $gte: startDate, $lte: endDate } };
    if (staffId) attendanceFilter.staff = staffId;

    const records = await Attendance.find(attendanceFilter)
      .populate("staff", "name specialization servicesFor phone").sort({ date: 1 });

    const websiteFilter = { status: "completed", date: { $gte: startDateObj, $lt: endDateObj }, assignedStaff: { $ne: null } };
    if (staffId) websiteFilter.assignedStaff = staffId;
    const websiteBookings = await Booking.find(websiteFilter)
      .select("assignedStaff assignedStaffName customerName totalAmount date time services bookingNumber");

    const manualFilter = { status: "completed", date: { $gte: startDateObj, $lt: endDateObj }, assignedStaff: { $ne: null } };
    if (staffId) manualFilter.assignedStaff = staffId;
    const manualBookings = await ManualBooking.find(manualFilter)
      .select("_id assignedStaff assignedStaffName customerName totalAmount date time servicesText bookingNumber source notes");

    const staffMap = {};

    for (const rec of records) {
      if (!rec.staff) continue;
      const sid = rec.staff._id.toString();
      if (!staffMap[sid]) staffMap[sid] = { staff: rec.staff, present: 0, absent: 0, halfDay: 0, leave: 0, totalDays: 0, totalEarnings: 0, totalBookings: 0, websiteBookings: [], manualBookings: [], records: [] };
      staffMap[sid].totalDays++;
      if (rec.status === "present")  staffMap[sid].present++;
      if (rec.status === "absent")   staffMap[sid].absent++;
      if (rec.status === "half-day") staffMap[sid].halfDay++;
      if (rec.status === "leave")    staffMap[sid].leave++;
      staffMap[sid].records.push({ date: rec.date, status: rec.status, checkIn: rec.checkIn, checkOut: rec.checkOut, bookingsHandled: rec.bookingsHandled, totalEarnings: rec.totalEarnings, notes: rec.notes });
    }

    for (const b of websiteBookings) {
      if (!b.assignedStaff) continue;
      const sid = b.assignedStaff.toString();
      if (!staffMap[sid]) staffMap[sid] = { staff: { _id: sid, name: b.assignedStaffName }, present: 0, absent: 0, halfDay: 0, leave: 0, totalDays: 0, totalEarnings: 0, totalBookings: 0, websiteBookings: [], manualBookings: [], records: [] };
      staffMap[sid].websiteBookings.push({ bookingNumber: b.bookingNumber, customerName: b.customerName, amount: b.totalAmount, date: new Date(b.date).toISOString().split("T")[0], time: b.time, services: b.services?.map((s) => s.name).join(", "), source: "website" });
      staffMap[sid].totalEarnings  += b.totalAmount || 0;
      staffMap[sid].totalBookings  += 1;
    }

    for (const b of manualBookings) {
      if (!b.assignedStaff) continue;
      const sid = b.assignedStaff.toString();
      if (!staffMap[sid]) staffMap[sid] = { staff: { _id: sid, name: b.assignedStaffName }, present: 0, absent: 0, halfDay: 0, leave: 0, totalDays: 0, totalEarnings: 0, totalBookings: 0, websiteBookings: [], manualBookings: [], records: [] };
      // ✅ Use _id (ObjectId) not bookingNumber for delete
      staffMap[sid].manualBookings.push({ _id: b._id.toString(), bookingNumber: b.bookingNumber, customerName: b.customerName, amount: b.totalAmount, date: new Date(b.date).toISOString().split("T")[0], time: b.time, services: b.servicesText, source: b.source, notes: b.notes });
      staffMap[sid].totalEarnings += b.totalAmount || 0;
      staffMap[sid].totalBookings += 1;
    }

    res.status(200).json({ success: true, month, data: Object.values(staffMap) });
  } catch (error) { next(error); }
};

/* ─── STAFF BOOKING HISTORY ────────────────── */
exports.getStaffBookings = async (req, res, next) => {
  try {
    const { month } = req.query;
    const filter    = { assignedStaff: req.params.id };
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      filter.date = { $gte: new Date(year, mon - 1, 1), $lt: new Date(year, mon, 1) };
    }
    const [websiteBookings, manualBookings] = await Promise.all([
      Booking.find(filter).sort({ date: -1 }),
      ManualBooking.find(filter).sort({ date: -1 }),
    ]);
    const totalRevenue =
      websiteBookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.totalAmount, 0) +
      manualBookings.filter((b)  => b.status === "completed").reduce((s, b) => s + b.totalAmount, 0);
    res.status(200).json({
      success: true,
      summary: { total: websiteBookings.length + manualBookings.length, totalRevenue },
      data: [
        ...websiteBookings.map((b) => ({ ...b.toObject(), source: "website" })),
        ...manualBookings.map((b)  => ({ ...b.toObject(), source: b.source })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)),
    });
  } catch (error) { next(error); }
};

/* ─── CREATE MANUAL BOOKING ────────────────── */
exports.createManualBooking = async (req, res, next) => {
  try {
    const { customerName, phone, date, time, servicesText, totalAmount, staffId, source, notes } = req.body;
    if (!customerName || !date || !time || !servicesText || totalAmount === undefined) {
      return res.status(400).json({ success: false, message: "customerName, date, time, servicesText, totalAmount are required" });
    }
    const staff  = staffId ? await Staff.findById(staffId) : null;
    const manual = await ManualBooking.create({
      bookingNumber:     "MB" + Date.now(),
      customerName, phone: phone || "",
      date: new Date(date), time, servicesText,
      totalAmount:       Number(totalAmount),
      assignedStaff:     staffId || null,
      assignedStaffName: staff?.name || null,
      source:            source || "manual",
      notes:             notes || "",
      status:            "completed",
      createdBy:         req.admin._id,
    });

    // Update attendance
    if (staffId) {
      const dateStr = new Date(date).toISOString().split("T")[0];
      const att = await Attendance.findOne({ staff: staffId, date: dateStr });
      if (att) {
        att.bookingsHandled.push({ bookingId: manual._id, bookingNumber: manual.bookingNumber, customerName: manual.customerName, amount: manual.totalAmount, time: manual.time, source: manual.source });
        att.totalEarnings += manual.totalAmount;
        await att.save();
      }
    }

    res.status(201).json({ success: true, message: "Manual booking added", data: manual });
  } catch (error) { next(error); }
};

/* ─── GET ALL MANUAL BOOKINGS ──────────────── */
exports.getManualBookings = async (req, res, next) => {
  try {
    const { staffId, month } = req.query;
    const filter = {};
    if (staffId) filter.assignedStaff = staffId;
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      filter.date = { $gte: new Date(year, mon - 1, 1), $lt: new Date(year, mon, 1) };
    }
    const bookings = await ManualBooking.find(filter).populate("assignedStaff", "name").sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, total: bookings.length, data: bookings });
  } catch (error) { next(error); }
};

/* ─── DELETE MANUAL BOOKING ────────────────── */
// ✅ FIX: Find by MongoDB _id not bookingNumber
exports.deleteManualBooking = async (req, res, next) => {
  try {
    const booking = await ManualBooking.findById(req.params.id); // req.params.id = MongoDB _id
    if (!booking) return res.status(404).json({ success: false, message: "Manual booking not found" });

    if (booking.assignedStaff) {
      const dateStr = new Date(booking.date).toISOString().split("T")[0];
      const att = await Attendance.findOne({ staff: booking.assignedStaff, date: dateStr });
      if (att) {
        att.bookingsHandled = att.bookingsHandled.filter((b) => b.bookingId?.toString() !== booking._id.toString());
        att.totalEarnings   = Math.max(0, att.totalEarnings - booking.totalAmount);
        await att.save();
      }
    }

    await booking.deleteOne();
    res.status(200).json({ success: true, message: "Manual booking deleted" });
  } catch (error) { next(error); }
};