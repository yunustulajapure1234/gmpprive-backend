const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllAdmins,
  deleteAdmin
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/login', login);
  
// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Super admin only routes
// ✅ TEMP FIX
router.post('/register', register);
router.get('/all', protect, authorize('super-admin'), getAllAdmins);
router.delete('/:id', protect, authorize('super-admin'), deleteAdmin);


module.exports = router;
