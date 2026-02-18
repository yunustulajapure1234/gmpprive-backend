const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload"); // ✅ FIX HERE

const {
  uploadImage,
  deleteImage,
  getAllImages,
} = require("../controllers/uploadController");

// ✅ Upload image to AWS S3
router.post(
  "/",
  protect,
  upload.single("image"),
  uploadImage
);

// ✅ Get all images
router.get("/images", protect, getAllImages);

// ✅ Delete image from S3
router.delete("/:filename", protect, deleteImage);

module.exports = router;
