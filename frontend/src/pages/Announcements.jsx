import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Megaphone, Plus, Trash2, Send } from "lucide-react";
export default function Announcements({ showToast }) {
  const { user } = useAuth();
  const admin = user.role === "admin";
  const [items, setItems] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [form, setForm] = useState(null),
    [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    try {
      setItems((await apiRequest("/workspace/announcements")).announcements);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await apiRequest("/workspace/announcements", {
        method: "POST",
        body: JSON.stringify(form),
      });
      showToast(r.message);
      setForm(null);
      await load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!window.confirm("Hapus pengumuman ini?")) return;
    setBusy(true);
    try {
      await apiRequest("/workspace/announcements/" + id, { method: "DELETE" });
      showToast("Pengumuman dihapus.");
      await load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="dashboard-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">TETAP TERHUBUNG</span>
          <h2>Papan pengumuman</h2>
          <p>
            Informasi, agenda, dan arahan terbaru untuk seluruh peserta magang.
          </p>
        </div>
        {admin && (
          <button
            className="btn btn-primary"
            onClick={() =>
              setForm({ title: "", content: "", priority: "normal" })
            }
          >
            <Plus size={17} />
            Buat pengumuman
          </button>
        )}
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
          <button onClick={load}>Coba lagi</button>
        </div>
      )}
      <div className="announcement-grid">
        {items.map((x) => (
          <article
            className={"card announcement-card " + x.priority}
            key={x.id}
          >
            <div className="section-heading">
              <span
                className={
                  "badge " +
                  (x.priority === "important" ? "badge-late" : "badge-approved")
                }
              >
                {x.priority === "important" ? "Penting" : "Informasi"}
              </span>
              {admin && (
                <button
                  className="text-button"
                  aria-label={"Hapus " + x.title}
                  disabled={busy}
                  onClick={() => remove(x.id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <h3>{x.title}</h3>
            <p className="announcement-content">{x.content}</p>
            <footer>
              <span className="mini-avatar">{x.author[0]}</span>
              <div>
                <strong>{x.author}</strong>
                <small>
                  {new Date(
                    x.created_at.replace(" ", "T") + "Z",
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Asia/Jakarta",
                  })}
                </small>
              </div>
            </footer>
          </article>
        ))}
      </div>
      {!items.length && (
        <section className="card empty-state">
          <Megaphone size={36} />
          <strong>
            {loading ? "Memuat informasi…" : "Belum ada pengumuman"}
          </strong>
          <p>Informasi yang diterbitkan pembina akan tampil di halaman ini.</p>
        </section>
      )}
      {form && (
        <div className="modal-overlay">
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-title"
          >
            <div className="modal-header">
              <h3 id="announcement-title">Pengumuman baru</h3>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="news-title">
                    Judul
                  </label>
                  <input
                    id="news-title"
                    className="form-input"
                    value={form.title}
                    required
                    minLength="3"
                    maxLength="120"
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="news-content">
                    Isi pengumuman
                  </label>
                  <textarea
                    id="news-content"
                    className="form-textarea"
                    rows="6"
                    value={form.content}
                    required
                    minLength="10"
                    maxLength="4000"
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                  />
                </div>
                <label className="form-label" htmlFor="news-priority">
                  Prioritas
                </label>
                <select
                  id="news-priority"
                  className="form-select"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  <option value="normal">Informasi</option>
                  <option value="important">Penting</option>
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setForm(null)}
                  disabled={busy}
                >
                  Batal
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  <Send size={16} />
                  {busy ? "Menerbitkan…" : "Terbitkan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
