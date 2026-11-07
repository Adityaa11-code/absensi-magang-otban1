const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);
router.use((req, res, next) =>
  req.user.role === "intern"
    ? next()
    : res.status(403).json({ message: "Presensi hanya untuk peserta magang." }),
);

router.get("/today", attendanceController.getTodayStatus);
router.post("/check-in", attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);
router.get("/my-history", attendanceController.getMyHistory);
router.get("/my-stats", attendanceController.getMyStats);

module.exports = router;
