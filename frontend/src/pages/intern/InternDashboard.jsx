import React, { useEffect, useState } from "react";
import { api, apiRequest } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  MapPin,
  LocateFixed,
  LogIn,
  LogOut,
  Clock,
  CheckCheck,
  CalendarDays,
  BookOpen,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
const distance = (a, b, c, d) => {
  const r = (x) => (x * Math.PI) / 180;
  const x =
    Math.sin(r(c - a) / 2) ** 2 +
    Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
};
export default function InternDashboard({ showToast, setTab }) {
  const { user } = useAuth();
  const [data, setData] = useState(null),
    [stats, setStats] = useState(null),
    [news, setNews] = useState([]),
    [clock, setClock] = useState(new Date()),
    [coords, setCoords] = useState(null),
    [geoError, setGeoError] = useState(""),
    [locating, setLocating] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [report, setReport] = useState(""),
    [checkout, setCheckout] = useState(false);
  async function load() {
    try {
      setError("");
      const [a, b, c] = await Promise.all([
        api.getTodayStatus(),
        api.getMyStats(),
        apiRequest("/workspace/announcements"),
      ]);
      setData(a);
      setStats(b.stats);
      setNews(c.announcements);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const settings = data?.settings,
    a = data?.attendance,
    leave = data?.activeLeave;
  const meters =
    coords && settings
      ? distance(
          settings.officeLat,
          settings.officeLng,
          coords.latitude,
          coords.longitude,
        )
      : null;
  const inside = meters !== null && meters <= settings?.radiusMeters;
  const permitted =
    settings &&
    !leave &&
    (!settings.radiusEnabled ||
      (inside && Date.now() - coords.timestamp < 120000));
  async function locate() {
    if (!navigator.geolocation) {
      setGeoError("Perangkat ini tidak mendukung lokasi.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
          timestamp: Date.now(),
        });
        setLocating(false);
      },
      (e) => {
        setCoords(null);
        setGeoError(
          e.code === 1
            ? "Izinkan akses lokasi pada pengaturan browser, kemudian coba lagi."
            : "Lokasi belum ditemukan. Pastikan GPS aktif dan coba kembali.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }
  async function attend(out) {
    if (out && report.trim().length < 20) {
      showToast("Ringkasan kegiatan minimal 20 karakter.", "error");
      return;
    }
    if (
      settings.radiusEnabled &&
      (!coords || Date.now() - coords.timestamp > 120000)
    ) {
      setGeoError("Lokasi sudah kedaluwarsa. Periksa lokasi kembali.");
      return;
    }
    setBusy(true);
    try {
      const body = coords
        ? { latitude: coords.latitude, longitude: coords.longitude }
        : {};
      const r = out
        ? await api.checkOut({ ...body, dailyReport: report.trim() })
        : await api.checkIn(body);
      showToast(r.message);
      setCheckout(false);
      setReport("");
      await load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  const days =
    user.start_date && user.end_date
      ? Math.max(
          1,
          Math.round(
            (new Date(user.end_date) - new Date(user.start_date)) / 86400000,
          ) + 1,
        )
      : null;
  const elapsed = days
    ? Math.min(
        days,
        Math.max(
          0,
          Math.floor((clock - new Date(user.start_date)) / 86400000) + 1,
        ),
      )
    : 0;
  return (
    <div className="dashboard-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">RUANG KERJA PESERTA</span>
          <h2>
            Halo, {user.name.split(" ")[0]}{" "}
            <span className="greeting-dot">✦</span>
          </h2>
          <p>
            Siap untuk pengalaman baru? Mulai harimu dengan mencatat kehadiran.
          </p>
        </div>
        <span className="badge badge-approved">
          {user.division || "Peserta magang"}
        </span>
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error} <button onClick={load}>Coba lagi</button>
        </div>
      )}
      <div className="intern-top-grid">
        <section className="presensi-card">
          <div className="presensi-heading">
            <span className="banner-label">
              <span className="live-dot" /> PRESENSI HARI INI
            </span>
            <span className="work-hours">
              {settings?.workStartTime || "—"} – {settings?.workEndTime || "—"}{" "}
              WIB
            </span>
          </div>
          <div className="clock-display">
            {clock
              .toLocaleTimeString("id-ID", {
                hour12: false,
                timeZone: "Asia/Jakarta",
              })
              .replaceAll(".", ":")}
            <span>WIB</span>
          </div>
          <p className="clock-date">
            {clock.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            })}
          </p>
          <div className="presensi-steps">
            <div className={a?.check_in_time ? "done" : ""}>
              <span>
                <LogIn size={18} />
              </span>
              <section>
                <small>Absen masuk</small>
                <strong>{a?.check_in_time || "Belum tercatat"}</strong>
              </section>
            </div>
            <div className={a?.check_out_time ? "done" : ""}>
              <span>
                <LogOut size={18} />
              </span>
              <section>
                <small>Absen pulang</small>
                <strong>{a?.check_out_time || "Belum tercatat"}</strong>
              </section>
            </div>
          </div>
          {leave ? (
            <div className="presensi-note">
              Izin {leave.type} disetujui. Kamu tidak perlu presensi hari ini.
            </div>
          ) : a?.check_out_time ? (
            <div className="presensi-note">
              <CheckCheck size={18} /> Presensi hari ini selesai. Terima kasih
              atas kontribusimu!
            </div>
          ) : (
            <button
              className="btn attendance-action"
              disabled={!permitted || busy || locating}
              onClick={() =>
                a?.check_in_time ? setCheckout(true) : attend(false)
              }
            >
              {a?.check_in_time ? <LogOut size={19} /> : <LogIn size={19} />}{" "}
              {busy
                ? "Menyimpan…"
                : a?.check_in_time
                  ? "Catat absen pulang"
                  : "Catat absen masuk"}
              <ArrowRight size={18} />
            </button>
          )}
        </section>
        <section className="card location-card">
          <div className="section-heading">
            <div>
              <h3>Lokasi presensi</h3>
              <p>Validasi area kantor</p>
            </div>
            <MapPin size={20} />
          </div>
          <div className={"location-illustration " + (inside ? "located" : "")}>
            <div />
            <span>
              <MapPin size={31} />
            </span>
            <i />
          </div>
          <strong>
            {!settings
              ? "Memuat pengaturan…"
              : !settings.radiusEnabled
                ? "Validasi radius dinonaktifkan"
                : meters === null
                  ? "Periksa lokasimu dahulu"
                  : inside
                    ? "Kamu berada di area kantor"
                    : "Kamu di luar area kantor"}
          </strong>
          <p>
            {meters === null
              ? `Radius kantor ${settings?.radiusMeters || "—"} meter`
              : `Jarak ${meters.toLocaleString("id-ID")} meter · akurasi ±${Math.round(coords.accuracy)} m`}
          </p>
          {geoError && (
            <div className="inline-error" role="alert">
              {geoError}
            </div>
          )}
          <button
            className="btn btn-outline"
            disabled={locating}
            onClick={locate}
          >
            <LocateFixed size={17} className={locating ? "spin" : ""} />
            {locating ? "Mencari lokasi…" : "Periksa lokasi saya"}
          </button>
          <small>
            Lokasi berlaku 2 menit.{" "}
            {settings?.officeName || "Kantor Otban Wilayah I"}
          </small>
        </section>
      </div>
      <div className="metric-grid">
        {[
          [
            CalendarDays,
            "Hadir bulan ini",
            stats?.totalPresent,
            "Hari kehadiran tercatat",
            "teal",
          ],
          [
            CheckCheck,
            "Tepat waktu",
            stats?.onTime,
            "Pertahankan kedisiplinanmu",
            "green",
          ],
          [
            Clock,
            "Terlambat",
            stats?.late,
            "Datang sebelum jam masuk",
            "amber",
          ],
          [
            BookOpen,
            "Izin / sakit",
            (stats?.sickCount || 0) + (stats?.permissionCount || 0),
            "Hari kerja yang disetujui",
            "violet",
          ],
        ].map(([Icon, label, n, detail, color]) => (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <i className={color}>
                <Icon size={20} />
              </i>
            </div>
            <strong>{data ? n || 0 : "—"}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="card">
          <div className="section-heading">
            <div>
              <h3>Perjalanan magangmu</h3>
              <p>Belajar, berkontribusi, dan berkembang.</p>
            </div>
            <CalendarDays size={22} />
          </div>
          <div className="program-progress">
            <div>
              <strong>
                {days
                  ? `${Math.round((elapsed / days) * 100)}%`
                  : "Periode belum diatur"}
              </strong>
              <span>
                {days
                  ? `Hari ke-${elapsed} dari ${days} hari kalender`
                  : "Hubungi pembina untuk melengkapi periode magang."}
              </span>
            </div>
            <div className="progress-track">
              <i
                style={{ width: days ? (elapsed / days) * 100 + "%" : "0%" }}
              />
            </div>
            <footer>
              <span>{user.start_date || "Tanggal mulai"}</span>
              <span>{user.end_date || "Tanggal selesai"}</span>
            </footer>
          </div>
          <div className="logbook-callout">
            <BookOpen size={25} />
            <div>
              <strong>Jangan lewatkan cerita hari ini.</strong>
              <p>
                Catat tugas, pembelajaran, dan kendala untuk ditinjau pembina.
              </p>
            </div>
            <button
              aria-label="Buka logbook"
              onClick={() => setTab("logbooks")}
            >
              <ArrowUpIcon />
            </button>
          </div>
        </section>
        <section className="card">
          <div className="section-heading">
            <div>
              <h3>Papan pengumuman</h3>
              <p>Informasi terbaru dari pembina</p>
            </div>
            <button
              className="text-button"
              onClick={() => setTab("announcements")}
            >
              Semua <ArrowRight size={15} />
            </button>
          </div>
          {news.slice(0, 2).map((n) => (
            <article className="news-preview" key={n.id}>
              <span
                className={
                  "badge " +
                  (n.priority === "important" ? "badge-late" : "badge-approved")
                }
              >
                {n.priority === "important" ? "Penting" : "Informasi"}
              </span>
              <h4>{n.title}</h4>
              <p>{n.content}</p>
            </article>
          ))}
          {!news.length && (
            <div className="empty-state">
              <BookOpen size={28} />
              <strong>Belum ada pengumuman</strong>
              <p>Informasi dari pembina akan tampil di sini.</p>
            </div>
          )}
        </section>
      </div>
      {checkout && (
        <div className="modal-overlay">
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <div className="modal-header">
              <h3 id="checkout-title">Selesaikan hari magangmu</h3>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                attend(true);
              }}
            >
              <div className="modal-body">
                <p className="muted">
                  Ringkas pekerjaan hari ini sebelum mencatat jam pulang.
                  Logbook terperinci dapat dilengkapi melalui menu Logbook.
                </p>
                <label htmlFor="daily-report" className="form-label">
                  Ringkasan kegiatan
                </label>
                <textarea
                  id="daily-report"
                  className="form-textarea"
                  rows="5"
                  required
                  minLength="20"
                  maxLength="5000"
                  autoFocus
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Hari ini saya menyelesaikan…"
                />
                <small>{report.trim().length}/5000 karakter · minimal 20</small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => setCheckout(false)}
                >
                  Batal
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? "Menyimpan…" : "Konfirmasi absen pulang"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function ArrowUpIcon() {
  return <ArrowRight size={20} />;
}
