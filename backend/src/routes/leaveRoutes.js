const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticateToken);

router.post('/apply', upload.single('attachment'), leaveController.applyLeave);
router.get('/my-leaves', leaveController.getMyLeaves);
router.delete('/:id', leaveController.cancelLeave);

module.exports = router;
