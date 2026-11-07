import React, { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  Plus,
  Search,
  CheckCheck,
  RotateCcw,
  Send,
  Download,
  ArrowLeft,
} from "lucide-react";
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const labels = {
  pending: "Menunggu ulasan",
  approved: "Disetujui",
  revision: "Perlu revisi",
};
const blank = () => ({
  date: today(),
  title: "",
  activity: "",
  learning: "",
  obstacles: "",
});
export default function Logbooks({ showToast }) {
  const { user } = useAuth(),
    admin = user.role === "admin";
  const [items, setItems] = useState([]),
    [month, setMonth] = useState(today().slice(0, 7)),
    [status, setStatus] = useState(""),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [editor, setEditor] = useState(null),
    [selected, setSelected] = useState(null),
    [feedback, setFeedback] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await apiRequest(
        "/workspace/logbooks?" +
          new URLSearchParams({ month, ...(status ? { status } : {}) }),
      );
      setItems(r.logbooks);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [month, status]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await apiRequest("/workspace/logbooks", {
        method: "POST",
        body: JSON.stringify(editor),
      });
      showToast(r.message);
      setEditor(null);
      await load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  async function review(decision) {
    setBusy(true);
    try {
      const r = await apiRequest(`/workspace/logbooks/${selected.id}/review`, {
        method: "PUT",
        body: JSON.stringify({ status: decision, feedback }),
      });
      showToast(r.message);
      setSelected(null);
      await load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  const visible = items.filter((x) =>
    (x.name + " " + x.title + " " + x.activity)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  function download() {
    const rows = [
      [
        "Tanggal",
        "Nama",
        "Judul",
        "Kegiatan",
        "Pembelajaran",
        "Kendala",
        "Status",
        "Umpan balik",
      ],
      ...visible.map((x) => [
        x.date,
        x.name,
        x.title,
        x.activity,
        x.learning,
        x.obstacles,
        labels[x.status],
        x.feedback || "",
      ]),
    ];
    const safe = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((r) => r.map(safe).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `Logbook-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="dashboard-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">DOKUMENTASI PEMBELAJARAN</span>
          <h2>
            {admin
              ? "Kegiatan yang tumbuh, bersama."
              : "Pengalamanmu, terdokumentasi."}
          </h2>
          <p>
            {admin
              ? "Tinjau logbook peserta dan berikan umpan balik yang membangun."
              : "Catat kegiatan setelah presensi masuk. Satu logbook untuk setiap hari."}
          </p>
        </div>
        <div className="button-group">
          <button
            className="btn btn-outline"
            onClick={download}
            disabled={!visible.length}
          >
            <Download size={16} />
            Ekspor CSV
          </button>
          {!admin && (
            <button
              className="btn btn-primary"
              onClick={() => setEditor(blank())}
            >
              <Plus size={17} />
              Tulis logbook
            </button>
          )}
        </div>
      </div>
      <div className="mini-stat-row">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatus(status === key ? "" : key)}
            className={status === key ? "selected" : ""}
          >
            <span className={"badge badge-" + key}>{label}</span>
            <strong>{items.filter((x) => x.status === key).length}</strong>
          </button>
        ))}
      </div>
      <section className="card">
        <div className="filter-toolbar">
          <label>
            Bulan
            <input
              aria-label="Bulan logbook"
              className="form-input"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <label>
            Status
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua status</option>
              {Object.entries(labels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="search-label">
            Cari kegiatan / peserta
            <input
              className="form-input"
              value={search}
              placeholder="Ketik untuk mencari…"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <div className="inline-error" role="alert">
            {error}
            <button onClick={load}>Coba lagi</button>
          </div>
        )}
        {loading ? (
          <div className="empty-state">Memuat logbook…</div>
        ) : !visible.length ? (
          <div className="empty-state">
            <BookOpen size={35} />
            <strong>Belum ada catatan di periode ini</strong>
            <p>
              {admin
                ? "Logbook yang dikirim peserta akan muncul di sini."
                : "Mulai dokumentasikan kegiatan dan pembelajaran harianmu."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  {admin && <th>Peserta</th>}
                  <th>Kegiatan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((x) => (
                  <tr key={x.id}>
                    <td className="time-cell">{x.date}</td>
                    {admin && (
                      <td>
                        <strong>{x.name}</strong>
                        <small className="block muted">{x.division}</small>
                      </td>
                    )}
                    <td>
                      <strong>{x.title}</strong>
                      <p className="truncate-copy">{x.activity}</p>
                    </td>
                    <td>
                      <span className={"badge badge-" + x.status}>
                        {labels[x.status]}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSelected(x);
                          setFeedback(x.feedback || "");
                        }}
                      >
                        Lihat detail
                      </button>
                      {!admin && x.status !== "approved" && (
                        <button
                          className="text-button"
                          onClick={() => setEditor({ ...x })}
                        >
                          Edit & kirim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editor && (
        <div className="modal-overlay">
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logbook-editor-title"
          >
            <div className="modal-header">
              <h3 id="logbook-editor-title">Catatan kegiatan harian</h3>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                {[
                  ["date", "Tanggal kegiatan", "date", null],
                  ["title", "Judul kegiatan", "text", 3],
                  ["activity", "Kegiatan yang dikerjakan", "textarea", 20],
                  [
                    "learning",
                    "Pembelajaran / hasil yang diperoleh",
                    "textarea",
                    10,
                  ],
                  ["obstacles", "Kendala (opsional)", "textarea", 0],
                ].map(([key, label, type, min]) => (
                  <div className="form-group" key={key}>
                    <label className="form-label" htmlFor={"log-" + key}>
                      {label}
                      {min > 0 && <small> · minimal {min} karakter</small>}
                    </label>
                    {type === "textarea" ? (
                      <textarea
                        id={"log-" + key}
                        className="form-textarea"
                        rows="3"
                        value={editor[key]}
                        required={min > 0}
                        minLength={min || undefined}
                        maxLength={key === "activity" ? 5000 : 3000}
                        onChange={(e) =>
                          setEditor({ ...editor, [key]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        id={"log-" + key}
                        className="form-input"
                        type={type}
                        required
                        minLength={min || undefined}
                        maxLength={120}
                        max={type === "date" ? today() : undefined}
                        value={editor[key]}
                        onChange={(e) =>
                          setEditor({ ...editor, [key]: e.target.value })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditor(null)}
                  disabled={busy}
                >
                  Batal
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  <Send size={16} />
                  {busy ? "Mengirim…" : "Kirim ke pembina"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {selected && (
        <div className="modal-overlay">
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logbook-detail-title"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  {selected.date} · {selected.name}
                </span>
                <h3 id="logbook-detail-title">{selected.title}</h3>
              </div>
            </div>
            <div className="modal-body">
              <span className={"badge badge-" + selected.status}>
                {labels[selected.status]}
              </span>
              {[
                ["activity", "Kegiatan"],
                ["learning", "Pembelajaran"],
                ["obstacles", "Kendala"],
                ["feedback", "Umpan balik pembina"],
              ].map(([key, label]) => (
                <section className="detail-section" key={key}>
                  <h4>{label}</h4>
                  <p>{selected[key] || "—"}</p>
                </section>
              ))}
              {selected.reviewer && (
                <small className="muted">
                  Ditinjau oleh {selected.reviewer}
                </small>
              )}
              {admin && selected.status === "pending" && (
                <div className="form-group">
                  <label htmlFor="review-notes" className="form-label">
                    Catatan ulasan (wajib untuk revisi)
                  </label>
                  <textarea
                    id="review-notes"
                    className="form-textarea"
                    maxLength="3000"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows="3"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setSelected(null)}
                disabled={busy}
              >
                Tutup
              </button>
              {admin && selected.status === "pending" && (
                <>
                  <button
                    className="btn btn-outline"
                    disabled={busy || feedback.trim().length < 5}
                    onClick={() => review("revision")}
                  >
                    <RotateCcw size={16} />
                    Revisi
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() => review("approved")}
                  >
                    <CheckCheck size={16} />
                    Setujui
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
