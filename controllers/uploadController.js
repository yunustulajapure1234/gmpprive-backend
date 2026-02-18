const path = require('path');
const fs = require('fs');

// @desc    Upload service image
// @route   POST /api/upload
// @access  Private (Admin)
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Generate image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete uploaded image
// @route   DELETE /api/upload/:filename
// @access  Private (Admin)
exports.deleteImage = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all uploaded images
// @route   GET /api/upload/images
// @access  Private (Admin)
exports.getAllImages = async (req, res, next) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Read directory
    const files = fs.readdirSync(uploadsDir);
    
    // Filter only image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    // Generate URLs
    const images = imageFiles.map(file => ({
      filename: file,
      url: `${req.protocol}://${req.get('host')}/uploads/${file}`,
      uploadedAt: fs.statSync(path.join(uploadsDir, file)).birthtime
    }));

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    next(error);
  }
};
