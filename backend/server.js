require("dotenv").config({path:require("path").join(__dirname,".env")});
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

// Inisialisasi Database
require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const leaveRoutes = require("./src/routes/leaveRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.disable("x-powered-by");
app.use(
  cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

// Melayani folder uploads untuk berkas bukti perizinan
const { authenticateToken } = require("./src/middleware/authMiddleware");
const db = require("./src/config/db");
app.get("/api/attachments/:id", authenticateToken, (req, res) => {
  const leave = db
    .prepare("SELECT * FROM leaves WHERE id=?")
    .get(req.params.id);
  if (!leave || (req.user.role !== "admin" && leave.user_id !== req.user.id))
    return res.status(404).json({ message: "Berkas tidak ditemukan." });
  if (!leave.attachment_path)
    return res.status(404).json({ message: "Tidak ada lampiran." });
  res.set("X-Content-Type-Options", "nosniff");
  res.download(
    path.join(__dirname, "uploads", path.basename(leave.attachment_path)),
  );
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Sistem Informasi Absensi Anak Magang Otban 1 API",
    timestamp: new Date().toISOString(),
  });
});

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/workspace", require("./src/routes/workspaceRoutes"));
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/"))
    return res.status(404).json({ message: "Endpoint tidak ditemukan." });
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"), (err) => {
    if (err) next(err);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({
        success: false,
        message: `Kesalahan unggah file: ${err.message}`,
      });
  }
  res
    .status(err.status || 500)
    .json({
      success: false,
      message:
        err.status === 400
          ? "Permintaan atau format berkas tidak valid."
          : "Terjadi kesalahan pada server. Silakan coba kembali.",
    });
});

if (require.main === module)
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`✈ SISTEM INFORMASI ABSENSI ANAK MAGANG OTBAN 1`);
    console.log(` Kantor Otoritas Bandar Udara Wilayah I (Soekarno-Hatta)`);
    console.log(` Backend API berjalan di: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });

module.exports = app;
