const bcrypt = require('bcryptjs');
const db = require('../config/db');

function seedDatabase() {
  console.log('--- Memulai Seeding Data Sistem Informasi Absensi Otban 1 ---');

  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('AdminOtban2026!', salt);
  const internPasswordHash = bcrypt.hashSync('MagangOtban2026!', salt);

  // 1. Seed / Upsert Admin
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@otban1.id');
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (name, email, password, role, division, phone, status)
      VALUES (?, ?, ?, 'admin', 'Subbagian Kepegawaian & Tata Usaha', '081289001122', 'active')
    `).run('Pembina Magang Otban Wilayah I', 'admin@otban1.id', adminPasswordHash);
    console.log('✓ Akun Admin berhasil dibuat: admin@otban1.id / AdminOtban2026!');
  } else {
    console.log('ℹ Akun Admin sudah ada.');
  }

  // 2. Seed Interns
  const internsData = [
    {
      name: 'Rizky Pratama',
      email: 'magang@otban1.id',
      nim: '2110512044',
      institution: 'Universitas Dirgantara Marsekal Suryadarma',
      major: 'Teknik Penerbangan',
      division: 'Divisi Kelaikudaraan & Pengoperasian Pesawat Udara',
      phone: '081311223344',
      start_date: '2026-09-01',
      end_date: '2026-12-31',
    },
    {
      name: 'Sarah Azhari Putri',
      email: 'sarah.azhari@otban1.id',
      nim: '1202204112',
      institution: 'Politeknik Penerbangan Indonesia Curug',
      major: 'Manajemen Transportasi Udara',
      division: 'Divisi Pelayanan & Pengoperasian Bandar Udara',
      phone: '081288990011',
      start_date: '2026-09-01',
      end_date: '2026-12-31',
    },
    {
      name: 'Dimas Bagus Setiawan',
      email: 'dimas.setiawan@otban1.id',
      nim: '2021080133',
      institution: 'Universitas Trisakti',
      major: 'Sistem Informasi',
      division: 'Bagian Tata Usaha & Kepegawaian',
      phone: '081577665544',
      start_date: '2026-08-15',
      end_date: '2026-12-15',
    },
    {
      name: 'Anisa Rahmawati',
      email: 'anisa.rahma@otban1.id',
      nim: '1905211029',
      institution: 'Universitas Indonesia',
      major: 'Teknik Elektro / Avionic',
      division: 'Divisi Keamanan Penerbangan',
      phone: '081809988776',
      start_date: '2026-09-15',
      end_date: '2026-12-31',
    },
  ];

  for (const intern of internsData) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(intern.email);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (name, email, password, role, nim, institution, major, division, phone, start_date, end_date, status)
        VALUES (?, ?, ?, 'intern', ?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(
        intern.name,
        intern.email,
        internPasswordHash,
        intern.nim,
        intern.institution,
        intern.major,
        intern.division,
        intern.phone,
        intern.start_date,
        intern.end_date
      );
      console.log(`✓ Akun Peserta Magang dibuat: ${intern.email} (${intern.name})`);
    }
  }

  // 3. Pastikan settings koordinat kantor Otban 1 terkonfigurasi dengan tepat
  // Lokasi Kantor Otoritas Bandar Udara Wilayah I: Sekitar Bandara Soekarno-Hatta (-6.1265, 106.6548)
  const currentSettings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (currentSettings) {
    db.prepare(`
      UPDATE settings 
      SET office_name = 'Kantor Otoritas Bandar Udara Wilayah I',
          office_address = 'Kawasan Perkantoran Bandara Internasional Soekarno-Hatta, Tangerang, Banten 15126',
          office_lat = -6.126500,
          office_lng = 106.654800,
          radius_meters = 350,
          radius_enabled = 1,
          work_start_time = '08:00',
          work_end_time = '16:30'
      WHERE id = 1
    `).run();
  }

  // 4. Buat contoh data riwayat kehadiran sebelumnya untuk Rizky Pratama dan Sarah
  const rizky = db.prepare('SELECT id FROM users WHERE email = ?').get('magang@otban1.id');
  const sarah = db.prepare('SELECT id FROM users WHERE email = ?').get('sarah.azhari@otban1.id');

  if (rizky) {
    // Tambah riwayat beberapa hari lalu
    const pastDates = [
      { date: '2026-10-05', inTime: '07:45:12', inStatus: 'on_time', outTime: '16:35:00', report: 'Pemeriksaan dokumen kelaikudaraan pesawat ATR-72 bersama pembimbing lapangan.' },
      { date: '2026-10-06', inTime: '07:50:20', inStatus: 'on_time', outTime: '16:40:15', report: 'Mengikuti inspeksi rutin ramp check armada di Terminal 3 Bandara Soetta.' },
      { date: '2026-10-07', inTime: '08:12:05', inStatus: 'late', outTime: '16:45:00', report: 'Rekapitulasi logbook penerbangan mingguan dan validasi sertifikasi personil.' },
      { date: '2026-10-08', inTime: '07:40:00', inStatus: 'on_time', outTime: '16:30:20', report: 'Penyusunan draft laporan inspeksi keselamatan penerbangan.' },
      { date: '2026-10-09', inTime: '07:55:40', inStatus: 'on_time', outTime: '16:32:10', report: 'Rapat koordinasi divisi kelaikudaraan dan asistensi administrasi sertifikat registrasi.' },
    ];

    for (const d of pastDates) {
      const existAtt = db.prepare('SELECT id FROM attendances WHERE user_id = ? AND date = ?').get(rizky.id, d.date);
      if (!existAtt) {
        db.prepare(`
          INSERT INTO attendances (user_id, date, check_in_time, check_in_status, check_in_distance, check_out_time, check_out_status, check_out_distance, daily_report)
          VALUES (?, ?, ?, ?, 45.2, ?, 'on_time', 50.1, ?)
        `).run(rizky.id, d.date, d.inTime, d.inStatus, d.outTime, d.report);
      }
    }

    // Contoh izin yang sudah disetujui
    const existLeave = db.prepare('SELECT id FROM leaves WHERE user_id = ?').get(rizky.id);
    if (!existLeave) {
      db.prepare(`
        INSERT INTO leaves (user_id, start_date, end_date, type, reason, status, admin_notes)
        VALUES (?, '2026-10-02', '2026-10-02', 'izin', 'Menghadiri sidang seminar proposal akademik di kampus.', 'approved', 'Disetujui. Harap tetap menyelesaikan laporan mingguan.')
      `).run(rizky.id);
    }
  }

  if (sarah) {
    // Contoh izin pending dari Sarah yang butuh review admin
    const existPending = db.prepare('SELECT id FROM leaves WHERE user_id = ? AND status = ?').get(sarah.id, 'pending');
    if (!existPending) {
      db.prepare(`
        INSERT INTO leaves (user_id, start_date, end_date, type, reason, status)
        VALUES (?, '2026-10-14', '2026-10-14', 'sakit', 'Mengalami demam dan flu, disarankan istirahat dokter selama 1 hari.', 'pending')
      `).run(sarah.id);
    }
  }

  console.log('--- Seeding Selesai Sukses! ---');
}

seedDatabase();
