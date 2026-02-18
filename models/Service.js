const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: String,
    nameAr: String,

    description: String,
    descriptionAr: String,

    category: String,
    categoryAr: String,

    price: Number,
    duration: String,

   durations: [
  {
    minutes: Number,
    price: Number,
  },
],


    gender: {
      type: String,
      enum: ["women", "men"],
      required: true,
    },

    image: String,
    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);