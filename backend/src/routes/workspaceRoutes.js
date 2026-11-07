const router = require("express").Router();
const db = require("../config/db");
const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");
const { getWIBDateTime } = require("../utils/time");
const { validDate, text } = require("../utils/validation");
router.use(authenticateToken);
router.get("/announcements", (req, res) =>
  res.json({
    success: true,
    announcements: db
      .prepare(
        "SELECT a.*, u.name AS author FROM announcements a JOIN users u ON u.id=a.created_by ORDER BY a.id DESC LIMIT 100",
      )
      .all(),
  }),
);
router.post("/announcements", requireAdmin, (req, res) => {
  const { title, content, priority = "normal" } = req.body;
  if (
    !text(title, 3, 120) ||
    !text(content, 10, 4000) ||
    !["normal", "important"].includes(priority)
  )
    return res
      .status(400)
      .json({
        message: "Judul 3–120 karakter dan isi 10–4000 karakter wajib diisi.",
      });
  db.prepare(
    "INSERT INTO announcements(title,content,priority,created_by) VALUES(?,?,?,?)",
  ).run(title.trim(), content.trim(), priority, req.user.id);
  res
    .status(201)
    .json({ success: true, message: "Pengumuman berhasil diterbitkan." });
});
router.delete("/announcements/:id", requireAdmin, (req, res) => {
  const r = db
    .prepare("DELETE FROM announcements WHERE id=?")
    .run(req.params.id);
  if (!r.changes)
    return res.status(404).json({ message: "Pengumuman tidak ditemukan." });
  res.json({ success: true, message: "Pengumuman dihapus." });
});
router.get("/logbooks", (req, res) => {
  const conditions = [],
    args = [];
  if (req.user.role !== "admin") {
    conditions.push("l.user_id=?");
    args.push(req.user.id);
  }
  if (req.query.month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month))
      return res.status(400).json({ message: "Format bulan tidak valid." });
    conditions.push("substr(l.date,1,7)=?");
    args.push(req.query.month);
  }
  if (req.query.status) {
    conditions.push("l.status=?");
    args.push(req.query.status);
  }
  const items = db
    .prepare(
      "SELECT l.*,u.name,u.division,u.institution,r.name AS reviewer FROM logbooks l JOIN users u ON u.id=l.user_id LEFT JOIN users r ON r.id=l.reviewed_by " +
        (conditions.length ? "WHERE " + conditions.join(" AND ") : "") +
        " ORDER BY l.date DESC,l.id DESC LIMIT 500",
    )
    .all(...args);
  res.json({ success: true, logbooks: items });
});
router.post("/logbooks", (req, res) => {
  if (req.user.role !== "intern")
    return res
      .status(403)
      .json({ message: "Logbook hanya dapat dikirim peserta magang." });
  const { date, title, activity, learning, obstacles = "" } = req.body;
  if (
    !validDate(date) ||
    date > getWIBDateTime().date ||
    !text(title, 3, 120) ||
    !text(activity, 20, 5000) ||
    !text(learning, 10, 3000) ||
    typeof obstacles !== "string" ||
    obstacles.length > 3000
  )
    return res
      .status(400)
      .json({
        message:
          "Periksa tanggal, judul, kegiatan (minimal 20 karakter), dan pembelajaran (minimal 10 karakter).",
      });
  const old = db
    .prepare("SELECT status FROM logbooks WHERE user_id=? AND date=?")
    .get(req.user.id, date);
  if (old?.status === "approved")
    return res
      .status(409)
      .json({ message: "Logbook yang telah disetujui tidak dapat diubah." });
  const attendance = db
    .prepare(
      "SELECT id FROM attendances WHERE user_id=? AND date=? AND check_in_time IS NOT NULL",
    )
    .get(req.user.id, date);
  if (!attendance)
    return res
      .status(400)
      .json({
        message:
          "Logbook hanya dapat diisi untuk tanggal dengan presensi masuk.",
      });
  db.prepare(
    `INSERT INTO logbooks(user_id,date,title,activity,learning,obstacles) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,date) DO UPDATE SET title=excluded.title,activity=excluded.activity,learning=excluded.learning,obstacles=excluded.obstacles,status='pending',feedback=NULL,reviewed_by=NULL,reviewed_at=NULL,updated_at=CURRENT_TIMESTAMP`,
  ).run(
    req.user.id,
    date,
    title.trim(),
    activity.trim(),
    learning.trim(),
    obstacles.trim(),
  );
  res.json({
    success: true,
    message: "Logbook dikirim untuk ditinjau pembina.",
  });
});
router.put("/logbooks/:id/review", requireAdmin, (req, res) => {
  const { status, feedback = "" } = req.body;
  if (
    !["approved", "revision"].includes(status) ||
    typeof feedback !== "string" ||
    feedback.length > 3000 ||
    (status === "revision" && feedback.trim().length < 5)
  )
    return res
      .status(400)
      .json({
        message:
          "Pilih keputusan yang valid. Catatan revisi minimal 5 karakter.",
      });
  const r = db
    .prepare(
      `UPDATE logbooks SET status=?,feedback=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'`,
    )
    .run(status, feedback.trim(), req.user.id, req.params.id);
  if (!r.changes)
    return res
      .status(409)
      .json({
        message:
          "Logbook tidak ditemukan atau telah ditinjau. Muat ulang data.",
      });
  res.json({ success: true, message: "Ulasan logbook berhasil disimpan." });
});
router.get("/overview", (req, res) => {
  const { date } = getWIBDateTime();
  const pendingLogbooks = db
    .prepare(
      req.user.role === "admin"
        ? "SELECT COUNT(*) AS n FROM logbooks WHERE status='pending'"
        : "SELECT COUNT(*) AS n FROM logbooks WHERE user_id=? AND status='revision'",
    )
    .get(...(req.user.role === "admin" ? [] : [req.user.id])).n;
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    const row = db
      .prepare(
        "SELECT COUNT(*) AS present, COALESCE(SUM(check_in_status='late'),0) AS late FROM attendances WHERE date=?" +
          (req.user.role === "admin" ? "" : " AND user_id=?"),
      )
      .get(...(req.user.role === "admin" ? [day] : [day, req.user.id]));
    trend.push({ date: day, ...row });
  }
  res.json({ success: true, trend, pendingLogbooks });
});
module.exports = router;
