const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi tidak sesuai.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Akun Anda sedang dinonaktifkan. Hubungi Admin pembimbing.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi tidak sesuai.' });
    }

    // Generate JWT token (berlaku 7 hari)
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Jangan kirim hash password ke client
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: userData,
    });
  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
  }
}

function getProfile(req, res) {
  try {
    const user = db.prepare('SELECT id, name, email, role, nim, institution, major, division, phone, start_date, end_date, status, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat profil pengguna.' });
  }
}

function updateProfile(req, res) {
  try {
    const { name, phone, nim, institution, major } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nama lengkap tidak boleh kosong.' });
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, nim = COALESCE(?, nim), institution = COALESCE(?, institution), major = COALESCE(?, major)
      WHERE id = ?
    `).run(name.trim(), phone || null, nim || null, institution || null, major || null, req.user.id);

    const updated = db.prepare('SELECT id, name, email, role, nim, institution, major, division, phone, start_date, end_date, status FROM users WHERE id = ?').get(req.user.id);

    res.json({ success: true, message: 'Profil berhasil diperbarui.', user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
  }
}

function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Password saat ini dan password baru wajib diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal harus 6 karakter.' });
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    const isMatch = bcrypt.compareSync(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini tidak cocok.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);

    res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengganti kata sandi.' });
  }
}

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
};
