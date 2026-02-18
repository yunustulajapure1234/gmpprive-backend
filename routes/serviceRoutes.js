const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const serviceController = require("../controllers/serviceController");

router.get("/", serviceController.getAllServices);

router.post(
  "/",
  protect,
  upload.single("image"),
  serviceController.createService
);

router.put(
  "/:id",
  protect,
  upload.single("image"),
  serviceController.updateService
);

router.delete("/:id", protect, serviceController.deleteService);

module.exports = router;
