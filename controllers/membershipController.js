const MembershipPlan = require("../models/MembershipPlan");
const Member         = require("../models/Member");

/* ════════════════════════════════════════════
   PLAN CONTROLLERS
════════════════════════════════════════════ */

// GET all plans
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await MembershipPlan.find().sort({ tier: 1 });
    res.json({ success: true, data: plans });
  } catch(e){ next(e); }
};

// GET single plan
exports.getPlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success:false, message:"Plan not found" });
    res.json({ success: true, data: plan });
  } catch(e){ next(e); }
};

// CREATE plan
exports.createPlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.create(req.body);
    res.status(201).json({ success: true, message: "Plan created", data: plan });
  } catch(e){ next(e); }
};

// UPDATE plan
exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success:false, message:"Plan not found" });
    res.json({ success: true, message: "Plan updated", data: plan });
  } catch(e){ next(e); }
};

// DELETE plan
exports.deletePlan = async (req, res, next) => {
  try {
    const activeMembers = await Member.countDocuments({ plan: req.params.id, status: "active" });
    if (activeMembers > 0) return res.status(400).json({ success:false, message:`${activeMembers} active members on this plan` });
    await MembershipPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Plan deleted" });
  } catch(e){ next(e); }
};

/* ════════════════════════════════════════════
   MEMBER CONTROLLERS
════════════════════════════════════════════ */

// GET all members (with filters + expiry warnings)
exports.getMembers = async (req, res, next) => {
  try {
    const { status, plan, search, expiringSoon, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (plan)   filter.plan   = plan;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options:"i" } },
        { phone:        { $regex: search, $options:"i" } },
        { email:        { $regex: search, $options:"i" } },
      ];
    }

    // Expiring in next N days
    if (expiringSoon) {
      const days = parseInt(expiringSoon);
      const now  = new Date();
      const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      filter.endDate = { $gte: now, $lte: soon };
      filter.status  = "active";
    }

    const total   = await Member.countDocuments(filter);
    const members = await Member.find(filter)
      .populate("plan", "name tier monthlyFee color")
      .sort({ endDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Compute real-time status + days left for each
    const now = new Date();
    const enriched = members.map(m => {
      const obj = m.toObject();
      obj.daysLeft = Math.ceil((new Date(m.endDate) - now) / (1000*60*60*24));
      obj.isExpired = now > new Date(m.endDate);
      obj.isExpiringSoon = !obj.isExpired && obj.daysLeft <= 7;
      return obj;
    });

    // Stats summary
    const stats = {
      total:         await Member.countDocuments(),
      active:        await Member.countDocuments({ status:"active" }),
      expired:       await Member.countDocuments({ status:"expired" }),
      expiringSoon7: await Member.countDocuments({
        status: "active",
        endDate: { $gte: now, $lte: new Date(now.getTime() + 7*24*60*60*1000) }
      }),
      expiringSoon30: await Member.countDocuments({
        status: "active",
        endDate: { $gte: now, $lte: new Date(now.getTime() + 30*24*60*60*1000) }
      }),
    };

    res.json({ success:true, total, stats, data: enriched });
  } catch(e){ next(e); }
};

// GET single member
exports.getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id).populate("plan");
    if (!member) return res.status(404).json({ success:false, message:"Member not found" });
    const obj = member.toObject();
    const now = new Date();
    obj.daysLeft = Math.ceil((new Date(member.endDate) - now) / (1000*60*60*24));
    obj.isExpired = now > new Date(member.endDate);
    res.json({ success: true, data: obj });
  } catch(e){ next(e); }
};

// CREATE member (new subscription)
exports.createMember = async (req, res, next) => {
  try {
    const { customerName, phone, email, emiratesId, planId, subOptionLabel,
            startDate, paidAmount, paymentMethod, autoRenew, notes } = req.body;

    const plan = await MembershipPlan.findById(planId);
    if (!plan) return res.status(404).json({ success:false, message:"Plan not found" });

    // Calculate end date = start + 1 month
    const start = new Date(startDate);
    const end   = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const member = await Member.create({
      customerName, phone, email, emiratesId, notes,
      plan:         planId,
      planName:     plan.name,
      planTier:     plan.tier,
      subOptionLabel,
      startDate:    start,
      endDate:      end,
      monthlyFee:   plan.monthlyFee,
      paidAmount:   paidAmount || 0,
      paymentStatus: paidAmount >= plan.monthlyFee ? "paid" : paidAmount > 0 ? "partial" : "pending",
      paymentMethod: paymentMethod || "cash",
      status:        "active",
      autoRenew:     autoRenew || false,
      createdBy:     req.admin._id,
    });

    res.status(201).json({ success: true, message: `${customerName} enrolled in ${plan.name}`, data: member });
  } catch(e){ next(e); }
};

// UPDATE member
exports.updateMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
      .populate("plan");
    if (!member) return res.status(404).json({ success:false, message:"Member not found" });
    res.json({ success: true, message: "Member updated", data: member });
  } catch(e){ next(e); }
};

// DELETE member
exports.deleteMember = async (req, res, next) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Member removed" });
  } catch(e){ next(e); }
};

// RENEW membership
exports.renewMember = async (req, res, next) => {
  try {
    const { paidAmount, paymentMethod, note } = req.body;
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success:false, message:"Member not found" });

    // New dates: from today or from old endDate if still active
    const now         = new Date();
    const newStart    = now > member.endDate ? now : member.endDate;
    const newEnd      = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 1);

    member.renewals.push({
      renewedAt: now, newStartDate: newStart, newEndDate: newEnd,
      paidAmount, paymentMethod: paymentMethod || "cash",
      note: note || "", renewedBy: req.admin._id,
    });

    member.startDate     = newStart;
    member.endDate       = newEnd;
    member.status        = "active";
    member.paidAmount    = paidAmount || member.monthlyFee;
    member.paymentStatus = (paidAmount || 0) >= member.monthlyFee ? "paid" : paidAmount > 0 ? "partial" : "pending";
    await member.save();

    res.json({ success: true, message: "Membership renewed till " + newEnd.toLocaleDateString("en-GB"), data: member });
  } catch(e){ next(e); }
};

// MARK EXPIRED (batch update)
exports.syncExpiredStatus = async (req, res, next) => {
  try {
    const now = new Date();
    const result = await Member.updateMany(
      { status:"active", endDate: { $lt: now } },
      { $set: { status:"expired" } }
    );
    res.json({ success:true, message:`${result.modifiedCount} memberships marked expired` });
  } catch(e){ next(e); }
};

// Dashboard stats
exports.getMembershipStats = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, active, expired, cancelled, newThisMonth] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status:"active" }),
      Member.countDocuments({ status:"expired" }),
      Member.countDocuments({ status:"cancelled" }),
      Member.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);

    const expiring7  = await Member.countDocuments({ status:"active", endDate:{ $gte:now, $lte:new Date(now.getTime()+7*24*60*60*1000) } });
    const expiring30 = await Member.countDocuments({ status:"active", endDate:{ $gte:now, $lte:new Date(now.getTime()+30*24*60*60*1000) } });

    // Revenue this month
    const revenueAgg = await Member.aggregate([
      { $match: { createdAt:{ $gte: monthStart } } },
      { $group: { _id:null, total:{ $sum:"$paidAmount" } } }
    ]);
    const monthlyRevenue = revenueAgg[0]?.total || 0;

    // Members per plan
    const perPlan = await Member.aggregate([
      { $match: { status:"active" } },
      { $group: { _id:"$planName", count:{ $sum:1 }, tier:{ $first:"$planTier" } } },
      { $sort: { tier:1 } }
    ]);

    res.json({ success:true, data:{ total, active, expired, cancelled, newThisMonth, expiring7, expiring30, monthlyRevenue, perPlan } });
  } catch(e){ next(e); }
};