const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: String,
  gender: { type: String, enum: ["male", "female"] },
  rating: Number,
  image: String,
  location: {
    lat: Number,
    lng: Number
  },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("Staff", staffSchema);
