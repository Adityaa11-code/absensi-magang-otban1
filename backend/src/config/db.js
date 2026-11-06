const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'otban_absensi.db');
const db = new DatabaseSync(dbPath);

// Database schema initialization
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'intern', -- 'admin' or 'intern'
      nim TEXT,
      institution TEXT,
      major TEXT,
      division TEXT,
      phone TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'inactive'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      check_in_time TEXT, -- HH:mm:ss
      check_in_status TEXT, -- 'on_time' or 'late'
      check_in_lat REAL,
      check_in_lng REAL,
      check_in_distance REAL,
      check_out_time TEXT, -- HH:mm:ss
      check_out_status TEXT, -- 'on_time' or 'early_leave'
      check_out_lat REAL,
      check_out_lng REAL,
      check_out_distance REAL,
      daily_report TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      type TEXT NOT NULL, -- 'sakit', 'izin', 'dispensasi'
      reason TEXT NOT NULL,
      attachment_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      office_name TEXT DEFAULT 'Kantor Otoritas Bandar Udara Wilayah I',
      office_address TEXT DEFAULT 'Gedung Kantor Otoritas Bandar Udara Wilayah I, Kawasan Bandara Soekarno-Hatta, Tangerang, Banten',
      office_lat REAL DEFAULT -6.126500,
      office_lng REAL DEFAULT 106.654800,
      radius_meters INTEGER DEFAULT 250,
      radius_enabled INTEGER DEFAULT 1, -- 1: required, 0: bypass/testing
      work_start_time TEXT DEFAULT '08:00',
      work_end_time TEXT DEFAULT '16:30',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existingSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
  if (!existingSettings) {
    db.prepare(`
      INSERT INTO settings (id, office_name, office_address, office_lat, office_lng, radius_meters, radius_enabled, work_start_time, work_end_time)
      VALUES (1, 'Kantor Otoritas Bandar Udara Wilayah I', 'Gedung Kantor Otoritas Bandar Udara Wilayah I, Bandara Soekarno-Hatta, Tangerang', -6.126500, 106.654800, 250, 1, '08:00', '16:30')
    `).run();
  }
}

initDb();

module.exports = db;
