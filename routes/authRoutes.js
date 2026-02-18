const express = require("express");
const User = require("../models/User");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { phone, name } = req.body;

  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ phone, name });

  res.json({ success: true, user });
});

module.exports = router;
