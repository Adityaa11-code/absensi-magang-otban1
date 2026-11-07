-- SQLite migration: aman dijalankan kembali, tidak menghapus data.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS logbooks (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 date TEXT NOT NULL,
 title TEXT NOT NULL,
 activity TEXT NOT NULL,
 learning TEXT NOT NULL,
 obstacles TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','revision')),
 feedback TEXT,
 reviewed_by INTEGER REFERENCES users(id),
 reviewed_at TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id, date)
);
CREATE TABLE IF NOT EXISTS announcements (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 content TEXT NOT NULL,
 priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal','important')),
 created_by INTEGER NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendances(date);
CREATE INDEX IF NOT EXISTS idx_leaves_user_dates ON leaves(user_id,start_date,end_date);
CREATE INDEX IF NOT EXISTS idx_logbooks_status ON logbooks(status,date);
