const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  email: String,
  gender: { type: String, enum: ["male", "female"] }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
