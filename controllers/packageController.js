const Package = require("../models/Package");

/* =========================
   GET ALL PACKAGES
   ========================= */
exports.getPackages = async (req, res) => {
  const packages = await Package.find().sort({ createdAt: -1 });
  res.json({ success: true, data: packages });
};

/* =========================
   CREATE PACKAGE
   ========================= */
exports.createPackage = async (req, res) => {
  const pkg = await Package.create(req.body);
  res.status(201).json({ success: true, data: pkg });
};

/* =========================
   UPDATE PACKAGE
   ========================= */
exports.updatePackage = async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({ success: true, data: pkg });
};

/* =========================
   DELETE PACKAGE
   ========================= */
exports.deletePackage = async (req, res) => {
  await Package.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
