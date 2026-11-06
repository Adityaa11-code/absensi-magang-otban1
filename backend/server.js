require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Inisialisasi Database
require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Melayani folder uploads untuk berkas bukti perizinan
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Sistem Informasi Absensi Anak Magang Otban 1 API',
    timestamp: new Date().toISOString(),
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Kesalahan unggah file: ${err.message}` });
  }
  res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan internal pada server.' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`✈ SISTEM INFORMASI ABSENSI ANAK MAGANG OTBAN 1`);
  console.log(` Kantor Otoritas Bandar Udara Wilayah I (Soekarno-Hatta)`);
  console.log(` Backend API berjalan di: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
