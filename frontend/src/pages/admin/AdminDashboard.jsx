import React, { useEffect, useState } from "react";
import { api, apiRequest } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  UserCheck,
  Clock,
  FileClock,
  ArrowUpRight,
  RefreshCw,
  ArrowRight,
  BookOpen,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
export default function AdminDashboard({ showToast, setTab }) {
  const { user } = useAuth();
  const [data, setData] = useState(null),
    [overview, setOverview] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  async function load() {
    setBusy(true);
    setError("");
    try {
      const [a, b] = await Promise.all([
        api.getDashboardStats(),
        apiRequest("/workspace/overview"),
      ]);
      setData(a);
      setOverview(b);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const s = data?.stats || {},
    trend = overview?.trend || [],
    max = Math.max(1, ...trend.map((x) => x.present));
  const rate = s.totalInterns
    ? Math.round((s.presentToday / s.totalInterns) * 100)
    : 0;
  return (
    <div className="dashboard-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">PUSAT KENDALI MAGANG</span>
          <h2>
            Selamat datang, {user.name.split(" ")[0]}{" "}
            <span className="greeting-dot">✦</span>
          </h2>
          <p>
            Pantau kehadiran dan dampingi perkembangan peserta dalam satu
            tempat.
          </p>
        </div>
        <button className="btn btn-outline" onClick={load} disabled={busy}>
          <RefreshCw size={16} className={busy ? "spin" : ""} />
          Perbarui data
        </button>
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error} <button onClick={load}>Coba lagi</button>
        </div>
      )}
      <section className="overview-banner">
        <div>
          <span className="banner-label">
            <span className="live-dot" /> RINGKASAN HARI INI
          </span>
          <h2>
            Perjalanan magang yang
            <br />
            lebih terarah, setiap hari.
          </h2>
          <p>
            {busy
              ? "Menyiapkan ringkasan kehadiran…"
              : `${s.presentToday || 0} peserta hadir hari ini. ${s.pendingLeavesCount || 0} pengajuan izin menunggu keputusan.`}
          </p>
          <button
            className="btn banner-btn"
            onClick={() => setTab("admin-monitoring")}
          >
            Lihat monitoring <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="attendance-ring" style={{ "--progress": rate + "%" }}>
          <div>
            <strong>
              {rate}
              <small>%</small>
            </strong>
            <span>Kehadiran hari ini</span>
            <small>
              {s.presentToday || 0} dari {s.totalInterns || 0} peserta aktif
            </small>
          </div>
        </div>
        <span className="banner-watermark" aria-hidden="true">
          I
        </span>
      </section>
      <div className="metric-grid">
        {[
          [
            Users,
            "Peserta aktif",
            s.totalInterns,
            "Terdaftar dalam program",
            "teal",
          ],
          [
            UserCheck,
            "Hadir hari ini",
            s.presentToday,
            `${s.onTimeToday || 0} datang tepat waktu`,
            "green",
          ],
          [Clock, "Terlambat", s.lateToday, "Perlu perhatian pembina", "amber"],
          [
            FileClock,
            "Menunggu izin",
            s.pendingLeavesCount,
            `${s.leaveToday || 0} izin / sakit hari ini`,
            "violet",
          ],
        ].map(([Icon, label, value, detail, color]) => (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <i className={color}>
                <Icon size={20} />
              </i>
            </div>
            <strong>{busy ? "—" : (value ?? 0)}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="card trend-card">
          <div className="section-heading">
            <div>
              <h3>Tren kehadiran</h3>
              <p>Presensi masuk selama 7 hari terakhir</p>
            </div>
            <span className="chart-legend">
              <i />
              Hadir
            </span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={trend
              .map((x) => `${x.date}: ${x.present} hadir`)
              .join(", ")}
          >
            {trend.map((x) => (
              <div
                className={"bar-column " + (x.date === s.date ? "today" : "")}
                key={x.date}
              >
                <strong>{x.present}</strong>
                <div className="bar-track">
                  <div
                    style={{
                      height:
                        Math.max(x.present ? 8 : 0, (x.present / max) * 100) +
                        "%",
                    }}
                  />
                </div>
                <small>
                  {new Date(x.date + "T12:00:00Z").toLocaleDateString("id-ID", {
                    weekday: "short",
                    timeZone: "Asia/Jakarta",
                  })}
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="card attention-card">
          <div className="section-heading">
            <div>
              <h3>Perlu ditindaklanjuti</h3>
              <p>Prioritas pekerjaan pembina</p>
            </div>
            <span className="attention-dot" />
          </div>
          {[
            [
              FileClock,
              "Permohonan izin",
              s.pendingLeavesCount || 0,
              "admin-monitoring",
            ],
            [
              BookOpen,
              "Logbook menunggu ulasan",
              overview?.pendingLogbooks || 0,
              "logbooks",
            ],
            [
              ClipboardList,
              "Peserta belum presensi",
              s.notPresentToday || 0,
              "admin-interns",
            ],
          ].map(([Icon, label, n, target]) => (
            <button
              className="attention-row"
              key={label}
              onClick={() => setTab(target)}
            >
              <span className="attention-icon">
                <Icon size={19} />
              </span>
              <span>
                {label}
                <small>
                  {n ? "Lihat dan tindak lanjuti" : "Tidak ada tindak lanjut"}
                </small>
              </span>
              <strong>{n}</strong>
              <ArrowRight size={17} />
            </button>
          ))}
        </section>
      </div>
      <section className="card">
        <div className="section-heading">
          <div>
            <h3>Aktivitas presensi terbaru</h3>
            <p>Kehadiran peserta hari ini · waktu Indonesia barat</p>
          </div>
          <button
            className="text-button"
            onClick={() => setTab("admin-monitoring")}
          >
            Lihat semua <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Peserta magang</th>
                <th>Penempatan</th>
                <th>Masuk</th>
                <th>Pulang</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentAttendances || []).map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="person-cell">
                      <span className="mini-avatar">{a.name[0]}</span>
                      <div>
                        <strong>{a.name}</strong>
                        <small>
                          {a.institution || a.nim || "Peserta magang"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{a.division || "—"}</td>
                  <td className="time-cell">{a.check_in_time || "—"}</td>
                  <td className="time-cell">{a.check_out_time || "—"}</td>
                  <td>
                    <span className={"badge badge-" + a.check_in_status}>
                      {a.check_in_status === "late"
                        ? "Terlambat"
                        : "Tepat waktu"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!busy && !data?.recentAttendances?.length && (
            <div className="empty-state">
              <CalendarDays size={30} />
              <strong>Hari baru, aktivitas baru</strong>
              <p>
                Presensi peserta akan tampil di sini setelah mereka absen masuk.
              </p>
            </div>
          )}
          {busy && <div className="empty-state">Memuat aktivitas…</div>}
        </div>
      </section>
    </div>
  );
}
