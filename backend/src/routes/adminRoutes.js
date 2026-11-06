const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard-stats', adminController.getDashboardStats);

// Interns management
router.get('/interns', adminController.getAllInterns);
router.post('/interns', adminController.createIntern);
router.put('/interns/:id', adminController.updateIntern);
router.put('/interns/:id/reset-password', adminController.resetInternPassword);
router.delete('/interns/:id', adminController.deleteIntern);

// Attendances monitoring
router.get('/attendances', adminController.getAllAttendances);

// Leaves verification
router.get('/leaves', adminController.getAllLeaves);
router.put('/leaves/:id/verify', adminController.verifyLeave);

// Settings & Radius Geofencing
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Reports & Recap
router.get('/reports', adminController.getReportSummary);

module.exports = router;
