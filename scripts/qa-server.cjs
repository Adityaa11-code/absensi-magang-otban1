process.env.DB_PATH = ":memory:";
process.env.JWT_SECRET = "qa-local-only-123456789012345678901234567890";
require("../backend/src/utils/seeder");
const db = require("../backend/src/config/db");
const { date } = require("../backend/src/utils/time").getWIBDateTime();
db.prepare("UPDATE settings SET radius_enabled=0").run();
const intern = db
  .prepare("SELECT id FROM users WHERE email='magang@otban1.id'")
  .get();
const admin = db.prepare("SELECT id FROM users WHERE role='admin'").get();
db.prepare(
  "INSERT OR IGNORE INTO attendances(user_id,date,check_in_time,check_in_status) VALUES(?,?,'07:45:12','on_time')",
).run(intern.id, date);
db.prepare(
  "INSERT OR IGNORE INTO logbooks(user_id,date,title,activity,learning) VALUES(?,?,?,?,?)",
).run(
  intern.id,
  date,
  "Verifikasi dokumen operasional",
  "Melakukan pendataan dan verifikasi kelengkapan dokumen operasional penerbangan.",
  "Memahami alur administrasi dan standar kelengkapan dokumen.",
);
db.prepare(
  "INSERT INTO announcements(title,content,priority,created_by) VALUES(?,?,?,?)",
).run(
  "Selamat datang di portal magang",
  "Catat kehadiran setiap hari dan lengkapi logbook untuk mendokumentasikan perkembangan kompetensimu. Pembina akan meninjau catatan dan memberikan umpan balik.",
  "normal",
  admin.id,
);
require("../backend/server").listen(5088, "127.0.0.1");
