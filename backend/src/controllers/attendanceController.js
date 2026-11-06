const db = require('../config/db');
const { calculateDistanceMeters } = require('../utils/geo');
const { getWIBDateTime } = require('../utils/time');

function getTodayStatus(req, res) {
  try {
    const { date, time } = getWIBDateTime();
    const userId = req.user.id;

    // Ambil data pengaturan kantor & radius terkini
    const settings = db.prepare('SELECT office_name, office_address, office_lat, office_lng, radius_meters, radius_enabled, work_start_time, work_end_time FROM settings WHERE id = 1').get();

    // Cek absensi hari ini
    const attendance = db.prepare('SELECT * FROM attendances WHERE user_id = ? AND date = ?').get(userId, date);

    // Cek apakah ada izin/sakit yang berlaku hari ini
    const activeLeave = db.prepare(`
      SELECT * FROM leaves 
      WHERE user_id = ? 
        AND status = 'approved' 
        AND ? BETWEEN start_date AND end_date
    `).get(userId, date);

    res.json({
      success: true,
      today: {
        date,
        currentTime: time,
      },
      settings: {
        officeName: settings.office_name,
        officeAddress: settings.office_address,
        officeLat: settings.office_lat,
        officeLng: settings.office_lng,
        radiusMeters: settings.radius_meters,
        radiusEnabled: Boolean(settings.radius_enabled),
        workStartTime: settings.work_start_time,
        workEndTime: settings.work_end_time,
      },
      attendance: attendance || null,
      activeLeave: activeLeave || null,
    });
  } catch (err) {
    console.error('Error getTodayStatus:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat status absensi hari ini.' });
  }
}

function checkIn(req, res) {
  try {
    const { date, time, hour, minute } = getWIBDateTime();
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    // Cek apakah sudah pernah check-in hari ini
    const existing = db.prepare('SELECT id, check_in_time FROM attendances WHERE user_id = ? AND date = ?').get(userId, date);
    if (existing && existing.check_in_time) {
      return res.status(400).json({
        success: false,
        message: `Anda sudah melakukan Absen Masuk hari ini pada pukul ${existing.check_in_time} WIB.`,
      });
    }

    // Cek apakah ada izin aktif hari ini
    const activeLeave = db.prepare(`
      SELECT * FROM leaves 
      WHERE user_id = ? 
        AND status = 'approved' 
        AND ? BETWEEN start_date AND end_date
    `).get(userId, date);

    if (activeLeave) {
      return res.status(400).json({
        success: false,
        message: `Hari ini Anda tercatat memiliki izin/sakit (${activeLeave.type.toUpperCase()}) yang telah disetujui.`,
      });
    }

    // Ambil konfigurasi kantor & radius
    const settings = db.prepare('SELECT office_lat, office_lng, radius_meters, radius_enabled, work_start_time FROM settings WHERE id = 1').get();

    let distance = 0;
    if (settings.radius_enabled === 1) {
      if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
        return res.status(400).json({
          success: false,
          message: 'Lokasi GPS tidak terdeteksi. Harap aktifkan izin lokasi (GPS) pada browser/perangkat Anda.',
        });
      }

      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      distance = calculateDistanceMeters(settings.office_lat, settings.office_lng, userLat, userLng);

      if (distance > settings.radius_meters) {
        const distanceDisplay = distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} meter`;
        const radiusDisplay = settings.radius_meters >= 1000 ? `${(settings.radius_meters / 1000).toFixed(2)} km` : `${settings.radius_meters} meter`;

        return res.status(400).json({
          success: false,
          message: `Gagal Absen: Anda berada di luar area kantor Otban 1! Jarak Anda: ${distanceDisplay} (Batas radius maksimal: ${radiusDisplay}).`,
          distance,
        });
      }
    } else if (latitude !== undefined && longitude !== undefined) {
      distance = calculateDistanceMeters(settings.office_lat, settings.office_lng, parseFloat(latitude), parseFloat(longitude));
    }

    // Tentukan status keterlambatan
    // Batas waktu: work_start_time (misal "08:00")
    const [startH, startM] = settings.work_start_time.split(':').map(Number);
    const isLate = (hour > startH) || (hour === startH && minute > startM);
    const checkInStatus = isLate ? 'late' : 'on_time';

    // Insert atau Update record absensi hari ini
    if (existing) {
      db.prepare(`
        UPDATE attendances 
        SET check_in_time = ?, check_in_status = ?, check_in_lat = ?, check_in_lng = ?, check_in_distance = ?
        WHERE id = ?
      `).run(time, checkInStatus, latitude || null, longitude || null, distance, existing.id);
    } else {
      db.prepare(`
        INSERT INTO attendances (user_id, date, check_in_time, check_in_status, check_in_lat, check_in_lng, check_in_distance)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, date, time, checkInStatus, latitude || null, longitude || null, distance);
    }

    const updated = db.prepare('SELECT * FROM attendances WHERE user_id = ? AND date = ?').get(userId, date);

    res.json({
      success: true,
      message: isLate
        ? `Absen Masuk berhasil dicatat pada ${time} WIB (Terlambat).`
        : `Absen Masuk berhasil dicatat pada ${time} WIB (Tepat Waktu).`,
      attendance: updated,
      distance,
    });
  } catch (err) {
    console.error('Error checkIn:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses Absen Masuk.' });
  }
}

function checkOut(req, res) {
  try {
    const { date, time, hour, minute } = getWIBDateTime();
    const userId = req.user.id;
    const { latitude, longitude, dailyReport } = req.body;

    const existing = db.prepare('SELECT * FROM attendances WHERE user_id = ? AND date = ?').get(userId, date);

    if (!existing || !existing.check_in_time) {
      return res.status(400).json({
        success: false,
        message: 'Anda belum melakukan Absen Masuk hari ini. Tidak dapat melakukan Absen Pulang.',
      });
    }

    if (existing.check_out_time) {
      return res.status(400).json({
        success: false,
        message: `Anda sudah melakukan Absen Pulang hari ini pada pukul ${existing.check_out_time} WIB.`,
      });
    }

    // Ambil konfigurasi kantor & radius
    const settings = db.prepare('SELECT office_lat, office_lng, radius_meters, radius_enabled, work_end_time FROM settings WHERE id = 1').get();

    let distance = 0;
    if (settings.radius_enabled === 1) {
      if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
        return res.status(400).json({
          success: false,
          message: 'Lokasi GPS tidak terdeteksi. Harap aktifkan izin lokasi perangkat Anda.',
        });
      }

      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      distance = calculateDistanceMeters(settings.office_lat, settings.office_lng, userLat, userLng);

      if (distance > settings.radius_meters) {
        const distanceDisplay = distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} meter`;
        const radiusDisplay = settings.radius_meters >= 1000 ? `${(settings.radius_meters / 1000).toFixed(2)} km` : `${settings.radius_meters} meter`;

        return res.status(400).json({
          success: false,
          message: `Gagal Absen: Anda berada di luar area kantor Otban 1! Jarak Anda: ${distanceDisplay} (Batas radius maksimal: ${radiusDisplay}).`,
          distance,
        });
      }
    } else if (latitude !== undefined && longitude !== undefined) {
      distance = calculateDistanceMeters(settings.office_lat, settings.office_lng, parseFloat(latitude), parseFloat(longitude));
    }

    // Cek jam pulang normal
    const [endH, endM] = settings.work_end_time.split(':').map(Number);
    const isEarly = (hour < endH) || (hour === endH && minute < endM);
    const checkOutStatus = isEarly ? 'early_leave' : 'on_time';

    db.prepare(`
      UPDATE attendances 
      SET check_out_time = ?, check_out_status = ?, check_out_lat = ?, check_out_lng = ?, check_out_distance = ?, daily_report = ?
      WHERE id = ?
    `).run(time, checkOutStatus, latitude || null, longitude || null, distance, dailyReport || null, existing.id);

    const updated = db.prepare('SELECT * FROM attendances WHERE id = ?').get(existing.id);

    res.json({
      success: true,
      message: isEarly
        ? `Absen Pulang berhasil dicatat pada ${time} WIB (Pulang Lebih Awal).`
        : `Absen Pulang berhasil dicatat pada ${time} WIB. Terima kasih atas kinerjanya hari ini!`,
      attendance: updated,
      distance,
    });
  } catch (err) {
    console.error('Error checkOut:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses Absen Pulang.' });
  }
}

function getMyHistory(req, res) {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let query = 'SELECT * FROM attendances WHERE user_id = ?';
    const params = [userId];

    if (month && year) {
      const monthPadded = month.toString().padStart(2, '0');
      query += ` AND strftime('%Y-%m', date) = ?`;
      params.push(`${year}-${monthPadded}`);
    } else if (year) {
      query += ` AND strftime('%Y', date) = ?`;
      params.push(`${year}`);
    }

    query += ' ORDER BY date DESC';

    const attendances = db.prepare(query).all(...params);
    res.json({ success: true, attendances });
  } catch (err) {
    console.error('Error getMyHistory:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat absensi.' });
  }
}

function getMyStats(req, res) {
  try {
    const userId = req.user.id;
    const { date } = getWIBDateTime();
    const currentMonthPrefix = date.substring(0, 7); // 'YYYY-MM'

    const totalPresent = db.prepare(`
      SELECT COUNT(*) as count FROM attendances 
      WHERE user_id = ? AND strftime('%Y-%m', date) = ? AND check_in_time IS NOT NULL
    `).get(userId, currentMonthPrefix).count;

    const onTime = db.prepare(`
      SELECT COUNT(*) as count FROM attendances 
      WHERE user_id = ? AND strftime('%Y-%m', date) = ? AND check_in_status = 'on_time'
    `).get(userId, currentMonthPrefix).count;

    const late = db.prepare(`
      SELECT COUNT(*) as count FROM attendances 
      WHERE user_id = ? AND strftime('%Y-%m', date) = ? AND check_in_status = 'late'
    `).get(userId, currentMonthPrefix).count;

    const sickCount = db.prepare(`
      SELECT COUNT(*) as count FROM leaves 
      WHERE user_id = ? AND type = 'sakit' AND status = 'approved' AND strftime('%Y-%m', start_date) = ?
    `).get(userId, currentMonthPrefix).count;

    const permissionCount = db.prepare(`
      SELECT COUNT(*) as count FROM leaves 
      WHERE user_id = ? AND type != 'sakit' AND status = 'approved' AND strftime('%Y-%m', start_date) = ?
    `).get(userId, currentMonthPrefix).count;

    res.json({
      success: true,
      stats: {
        totalPresent,
        onTime,
        late,
        sickCount,
        permissionCount,
      },
    });
  } catch (err) {
    console.error('Error getMyStats:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik kehadiran.' });
  }
}

module.exports = {
  getTodayStatus,
  checkIn,
  checkOut,
  getMyHistory,
  getMyStats,
};
