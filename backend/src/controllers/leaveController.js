const db = require('../config/db');

function applyLeave(req, res) {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type, reason } = req.body;

    if (!startDate || !endDate || !type || !reason) {
      return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi (tanggal mulai, selesai, tipe izin, alasan).' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai.' });
    }

    // Ambil path file lampiran jika diunggah
    let attachmentPath = null;
    if (req.file) {
      attachmentPath = `/uploads/${req.file.filename}`;
    }

    const stmt = db.prepare(`
      INSERT INTO leaves (user_id, start_date, end_date, type, reason, attachment_path, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(userId, startDate, endDate, type, reason.trim(), attachmentPath);
    const newLeave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      message: 'Pengajuan izin berhasil dikirim. Menunggu persetujuan Admin/Pembimbing.',
      leave: newLeave,
    });
  } catch (err) {
    console.error('Error applyLeave:', err);
    res.status(500).json({ success: false, message: 'Gagal mengajukan permohonan izin.' });
  }
}

function getMyLeaves(req, res) {
  try {
    const userId = req.user.id;
    const leaves = db.prepare('SELECT * FROM leaves WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json({ success: true, leaves });
  } catch (err) {
    console.error('Error getMyLeaves:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pengajuan izin.' });
  }
}

function cancelLeave(req, res) {
  try {
    const userId = req.user.id;
    const leaveId = req.params.id;

    const leave = db.prepare('SELECT * FROM leaves WHERE id = ? AND user_id = ?').get(leaveId, userId);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Pengajuan izin tidak ditemukan.' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Hanya pengajuan berstatus Menunggu Persetujuan yang dapat dibatalkan.' });
    }

    db.prepare('DELETE FROM leaves WHERE id = ?').run(leaveId);

    res.json({ success: true, message: 'Pengajuan izin berhasil dibatalkan.' });
  } catch (err) {
    console.error('Error cancelLeave:', err);
    res.status(500).json({ success: false, message: 'Gagal membatalkan pengajuan izin.' });
  }
}

module.exports = {
  applyLeave,
  getMyLeaves,
  cancelLeave,
};
