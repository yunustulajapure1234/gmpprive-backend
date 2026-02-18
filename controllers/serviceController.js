const Service = require("../models/Service");
const { uploadToS3 } = require("../middleware/upload");
const { deleteFromS3, getPresignedUrl } = require("../utils/s3");

// Add presigned URLs
const addPresignedUrls = async (services) => {
  return Promise.all(
    services.map(async (service) => {
      const obj = service.toObject ? service.toObject() : service;

      if (obj.image) {
        obj.imageUrl = await getPresignedUrl(obj.image);
      }

      return obj;
    })
  );
};

exports.createService = async (req, res) => {
  try {
    let imageKey = null;

    if (req.file) {
      imageKey = await uploadToS3(req.file);
    }

    const data = {
      name: req.body.name,
      nameAr: req.body.nameAr,
      description: req.body.description,
      descriptionAr: req.body.descriptionAr,
      category: req.body.category,
      categoryAr: req.body.categoryAr,
      gender: req.body.gender,
      image: imageKey,
      createdBy: req.admin.id,
    };

    if (req.body.durations) {
      const parsed = JSON.parse(req.body.durations);
      data.durations = parsed;
      data.price = undefined;
      data.duration = undefined;
    } else {
      data.price = Number(req.body.price);
      data.duration = req.body.duration;
      data.durations = [];
    }

    const service = await Service.create(data);
    const [withUrl] = await addPresignedUrls([service]);

    res.status(201).json({ success: true, data: withUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .sort({ createdAt: -1 });

    const servicesWithUrl = await addPresignedUrls(services);

    res.json({ success: true, data: servicesWithUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // IMAGE UPDATE
    if (req.file) {
      if (service.image) {
        await deleteFromS3(service.image);
      }
      service.image = await uploadToS3(req.file);
    }

    // BASIC FIELDS
    service.name = req.body.name || service.name;
    service.nameAr = req.body.nameAr || service.nameAr;
    service.description = req.body.description || service.description;
    service.descriptionAr = req.body.descriptionAr || service.descriptionAr;
    service.category = req.body.category || service.category;
    service.categoryAr = req.body.categoryAr || service.categoryAr;
    service.gender = req.body.gender || service.gender;

    // DURATIONS LOGIC
    if (req.body.durations && req.body.durations !== "undefined") {
      try {
        const parsed = JSON.parse(req.body.durations);

        if (Array.isArray(parsed) && parsed.length > 0) {
          service.durations = parsed.map((d) => ({
            minutes: Number(d.minutes),
            price: Number(d.price),
          }));

          service.price = undefined;
          service.duration = undefined;
        }
      } catch (parseError) {
        console.error("Duration Parse Error:", parseError);
      }
    } else {
      service.price = Number(req.body.price) || 0;
      service.duration = req.body.duration || "";
      service.durations = [];
    }

    await service.save();

    const [withUrl] = await addPresignedUrls([service]);

    res.json({
      success: true,
      data: withUrl,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service)
      return res.status(404).json({ success: false, message: "Not found" });

    if (service.image) {
      await deleteFromS3(service.image);
    }

    await service.deleteOne();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
