const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'otban1_rahasia_super_secure_jwt_key_2026!';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Sesi telah berakhir atau token tidak valid. Silakan login kembali.' });
    }

    // Ambil data user terkini dari database
    const user = db.prepare('SELECT id, name, email, role, nim, institution, division, status FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan dalam sistem.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan oleh Administrator.' });
    }

    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Akses ditolak: Anda tidak memiliki hak akses Administrator.' });
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET,
};
