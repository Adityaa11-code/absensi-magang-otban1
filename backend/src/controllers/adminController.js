const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { getWIBDateTime } = require('../utils/time');

function getDashboardStats(req, res) {
  try {
    const { date } = getWIBDateTime();

    // Total magang aktif
    const totalInterns = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'intern' AND status = 'active'`).get().count;

    // Hadir hari ini
    const presentToday = db.prepare(`
      SELECT COUNT(*) as count FROM attendances 
      WHERE date = ? AND check_in_time IS NOT NULL
    `).get(date).count;

    // Terlambat hari ini
    const lateToday = db.prepare(`
      SELECT COUNT(*) as count FROM attendances 
      WHERE date = ? AND check_in_status = 'late'
    `).get(date).count;

    // Tepat waktu hari ini
    const onTimeToday = db.prepare(`
      SELECT COUNT(*) as count FROM attendances 
      WHERE date = ? AND check_in_status = 'on_time'
    `).get(date).count;

    // Izin / Sakit hari ini yang approved
    const leaveToday = db.prepare(`
      SELECT COUNT(*) as count FROM leaves 
      WHERE status = 'approved' AND ? BETWEEN start_date AND end_date
    `).get(date).count;

    // Belum absen
    const notPresentToday = Math.max(0, totalInterns - presentToday - leaveToday);

    // Pengajuan izin yang masih pending
    const pendingLeavesCount = db.prepare(`SELECT COUNT(*) as count FROM leaves WHERE status = 'pending'`).get().count;

    // Feeds absensi hari ini (terbaru di atas)
    const recentAttendances = db.prepare(`
      SELECT a.*, u.name, u.nim, u.division, u.institution
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      WHERE a.date = ?
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(date);

    // Pengajuan izin terbaru yang pending
    const recentPendingLeaves = db.prepare(`
      SELECT l.*, u.name, u.nim, u.division, u.institution
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'pending'
      ORDER BY l.created_at DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      stats: {
        date,
        totalInterns,
        presentToday,
        onTimeToday,
        lateToday,
        leaveToday,
        notPresentToday,
        pendingLeavesCount,
      },
      recentAttendances,
      recentPendingLeaves,
    });
  } catch (err) {
    console.error('Error getDashboardStats:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat statistik dashboard.' });
  }
}

function getAllInterns(req, res) {
  try {
    const { search, division, status } = req.query;

    let query = `SELECT id, name, email, role, nim, institution, major, division, phone, start_date, end_date, status, created_at FROM users WHERE role = 'intern'`;
    const params = [];

    if (search) {
      query += ` AND (name LIKE ? OR nim LIKE ? OR email LIKE ? OR institution LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw, kw);
    }

    if (division) {
      query += ` AND division = ?`;
      params.push(division);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY name ASC`;

    const interns = db.prepare(query).all(...params);
    res.json({ success: true, interns });
  } catch (err) {
    console.error('Error getAllInterns:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data peserta magang.' });
  }
}

function createIntern(req, res) {
  try {
    const { name, email, password, nim, institution, major, division, phone, startDate, endDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Alamat email sudah terdaftar dalam sistem.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role, nim, institution, major, division, phone, start_date, end_date, status)
      VALUES (?, ?, ?, 'intern', ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      name.trim(),
      email.trim().toLowerCase(),
      hashedPassword,
      nim || null,
      institution || null,
      major || null,
      division || 'Pelayanan & Pengoperasian Bandar Udara',
      phone || null,
      startDate || null,
      endDate || null
    );

    const newIntern = db.prepare('SELECT id, name, email, role, nim, institution, major, division, phone, start_date, end_date, status FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, message: 'Peserta magang berhasil ditambahkan.', intern: newIntern });
  } catch (err) {
    console.error('Error createIntern:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan data peserta magang.' });
  }
}

function updateIntern(req, res) {
  try {
    const { id } = req.params;
    const { name, email, nim, institution, major, division, phone, startDate, endDate, status } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Peserta magang tidak ditemukan.' });
    }

    // Cek duplikasi email jika diubah
    if (email) {
      const emailConflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim().toLowerCase(), id);
      if (emailConflict) {
        return res.status(400).json({ success: false, message: 'Email sudah digunakan oleh pengguna lain.' });
      }
    }

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          nim = COALESCE(?, nim),
          institution = COALESCE(?, institution),
          major = COALESCE(?, major),
          division = COALESCE(?, division),
          phone = COALESCE(?, phone),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      nim || null,
      institution || null,
      major || null,
      division || null,
      phone || null,
      startDate || null,
      endDate || null,
      status || null,
      id
    );

    const updated = db.prepare('SELECT id, name, email, role, nim, institution, major, division, phone, start_date, end_date, status FROM users WHERE id = ?').get(id);

    res.json({ success: true, message: 'Data peserta magang berhasil diperbarui.', intern: updated });
  } catch (err) {
    console.error('Error updateIntern:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data peserta magang.' });
  }
}

function resetInternPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal harus 6 karakter.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id);

    res.json({ success: true, message: 'Kata sandi berhasil direset.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mereset kata sandi.' });
  }
}

function deleteIntern(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(id, 'intern');
    res.json({ success: true, message: 'Peserta magang dan riwayat terkait berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data peserta magang.' });
  }
}

function getAllAttendances(req, res) {
  try {
    const { date, startDate, endDate, division, search, status } = req.query;

    let query = `
      SELECT a.*, u.name, u.nim, u.institution, u.division, u.email
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND a.date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    if (division) {
      query += ` AND u.division = ?`;
      params.push(division);
    }

    if (status) {
      if (status === 'late') {
        query += ` AND a.check_in_status = 'late'`;
      } else if (status === 'on_time') {
        query += ` AND a.check_in_status = 'on_time'`;
      }
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.nim LIKE ? OR u.institution LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    query += ` ORDER BY a.date DESC, a.check_in_time DESC`;

    const attendances = db.prepare(query).all(...params);
    res.json({ success: true, attendances });
  } catch (err) {
    console.error('Error getAllAttendances:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat log kehadiran.' });
  }
}

function getAllLeaves(req, res) {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT l.*, u.name, u.nim, u.institution, u.division, u.email
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.nim LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw);
    }

    query += ` ORDER BY l.created_at DESC`;

    const leaves = db.prepare(query).all(...params);
    res.json({ success: true, leaves });
  } catch (err) {
    console.error('Error getAllLeaves:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat permohonan izin.' });
  }
}

function verifyLeave(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status harus bernilai approved atau rejected.' });
    }

    db.prepare(`
      UPDATE leaves 
      SET status = ?, admin_notes = ? 
      WHERE id = ?
    `).run(status, adminNotes || null, id);

    const updated = db.prepare(`
      SELECT l.*, u.name, u.nim, u.division
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).get(id);

    res.json({
      success: true,
      message: status === 'approved' ? 'Pengajuan izin berhasil disetujui.' : 'Pengajuan izin telah ditolak.',
      leave: updated,
    });
  } catch (err) {
    console.error('Error verifyLeave:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses verifikasi izin.' });
  }
}

function getSettings(req, res) {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan sistem.' });
  }
}

function updateSettings(req, res) {
  try {
    const {
      officeName,
      officeAddress,
      officeLat,
      officeLng,
      radiusMeters,
      radiusEnabled,
      workStartTime,
      workEndTime,
    } = req.body;

    db.prepare(`
      UPDATE settings 
      SET office_name = COALESCE(?, office_name),
          office_address = COALESCE(?, office_address),
          office_lat = COALESCE(?, office_lat),
          office_lng = COALESCE(?, office_lng),
          radius_meters = COALESCE(?, radius_meters),
          radius_enabled = COALESCE(?, radius_enabled),
          work_start_time = COALESCE(?, work_start_time),
          work_end_time = COALESCE(?, work_end_time),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      officeName || null,
      officeAddress || null,
      officeLat !== undefined ? parseFloat(officeLat) : null,
      officeLng !== undefined ? parseFloat(officeLng) : null,
      radiusMeters !== undefined ? parseInt(radiusMeters, 10) : null,
      radiusEnabled !== undefined ? (radiusEnabled ? 1 : 0) : null,
      workStartTime || null,
      workEndTime || null
    );

    const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();

    res.json({
      success: true,
      message: 'Pengaturan lokasi kantor & radius berhasil diperbarui.',
      settings: updated,
    });
  } catch (err) {
    console.error('Error updateSettings:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan.' });
  }
}

function getReportSummary(req, res) {
  try {
    const { startDate, endDate, division } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Rentang tanggal mulai dan selesai wajib ditentukan.' });
    }

    let usersQuery = `SELECT id, name, nim, institution, division FROM users WHERE role = 'intern' AND status = 'active'`;
    const userParams = [];

    if (division) {
      usersQuery += ` AND division = ?`;
      userParams.push(division);
    }
    usersQuery += ` ORDER BY name ASC`;

    const interns = db.prepare(usersQuery).all(...userParams);

    const reportData = interns.map((intern) => {
      // Hitung kehadiran dalam rentang tanggal
      const attendances = db.prepare(`
        SELECT check_in_status, check_out_status 
        FROM attendances 
        WHERE user_id = ? AND date BETWEEN ? AND ? AND check_in_time IS NOT NULL
      `).all(intern.id, startDate, endDate);

      const totalHadir = attendances.length;
      const tepatWaktu = attendances.filter(a => a.check_in_status === 'on_time').length;
      const terlambat = attendances.filter(a => a.check_in_status === 'late').length;

      // Hitung izin & sakit dalam rentang tanggal
      const leaves = db.prepare(`
        SELECT type FROM leaves 
        WHERE user_id = ? AND status = 'approved' 
          AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?) OR (? BETWEEN start_date AND end_date))
      `).all(intern.id, startDate, endDate, startDate, endDate, startDate);

      const sakit = leaves.filter(l => l.type === 'sakit').length;
      const izin = leaves.filter(l => l.type !== 'sakit').length;

      return {
        id: intern.id,
        name: intern.name,
        nim: intern.nim || '-',
        institution: intern.institution || '-',
        division: intern.division || '-',
        totalHadir,
        tepatWaktu,
        terlambat,
        sakit,
        izin,
      };
    });

    res.json({
      success: true,
      period: { startDate, endDate },
      division: division || 'Semua Divisi',
      report: reportData,
    });
  } catch (err) {
    console.error('Error getReportSummary:', err);
    res.status(500).json({ success: false, message: 'Gagal menyusun ringkasan laporan.' });
  }
}

module.exports = {
  getDashboardStats,
  getAllInterns,
  createIntern,
  updateIntern,
  resetInternPassword,
  deleteIntern,
  getAllAttendances,
  getAllLeaves,
  verifyLeave,
  getSettings,
  updateSettings,
  getReportSummary,
};
