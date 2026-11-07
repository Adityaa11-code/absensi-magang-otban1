const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.use(authenticateToken);
router.use((req, res, next) =>
  req.user.role === "intern"
    ? next()
    : res
        .status(403)
        .json({ message: "Pengajuan izin hanya untuk peserta magang." }),
);

router.post(
  "/apply",
  upload.single("attachment"),
  (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400 && req.file)
        require("fs").unlink(req.file.path, () => {});
    });
    next();
  },
  leaveController.applyLeave,
);
router.get("/my-leaves", leaveController.getMyLeaves);
router.delete("/:id", leaveController.cancelLeave);

module.exports = router;
