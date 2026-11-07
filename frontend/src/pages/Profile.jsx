import React, { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { UserRound, ShieldCheck, Save, LockKeyhole } from "lucide-react";
export default function Profile({ showToast }) {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
      name: user.name,
      phone: user.phone || "",
      nim: user.nim || "",
      institution: user.institution || "",
      major: user.major || "",
    }),
    [pw, setPw] = useState({
      currentPassword: "",
      newPassword: "",
      confirmation: "",
    }),
    [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.updateProfile(form);
      await refreshUser();
      showToast(r.message);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  async function password(e) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmation) {
      showToast("Konfirmasi kata sandi tidak cocok.", "error");
      return;
    }
    setBusy(true);
    try {
      const r = await api.changePassword(pw);
      showToast(r.message);
      setPw({ currentPassword: "", newPassword: "", confirmation: "" });
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
          <span className="eyebrow">AKUN PERSONAL</span>
          <h2>Profil & keamanan</h2>
          <p>Lengkapi informasi dirimu dan jaga keamanan akses akun.</p>
        </div>
      </div>
      <div className="profile-banner">
        <div className="profile-avatar">
          {user.name
            .split(" ")
            .slice(0, 2)
            .map((x) => x[0])
            .join("")}
        </div>
        <div>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <span className="badge badge-approved">
            {user.role === "admin"
              ? "Administrator / Pembina"
              : "Peserta magang"}
          </span>
        </div>
        <div className="profile-division">
          <small>PENEMPATAN</small>
          <strong>{user.division || "Belum ditentukan"}</strong>
          <span>
            {user.start_date || "—"} s.d. {user.end_date || "—"}
          </span>
        </div>
      </div>
      <div className="dashboard-columns">
        <section className="card">
          <div className="section-heading">
            <div>
              <h3>Informasi pribadi</h3>
              <p>Email, peran, dan penempatan dikelola administrator.</p>
            </div>
            <UserRound size={21} />
          </div>
          <form onSubmit={save}>
            {[
              ["name", "Nama lengkap"],
              ["phone", "Nomor telepon"],
              ...(user.role === "intern"
                ? [
                    ["nim", "NIM / NIS"],
                    ["institution", "Institusi / kampus"],
                    ["major", "Jurusan"],
                  ]
                : []),
            ].map(([key, label]) => (
              <div className="form-group" key={key}>
                <label className="form-label" htmlFor={"profile-" + key}>
                  {label}
                </label>
                <input
                  id={"profile-" + key}
                  className="form-input"
                  value={form[key]}
                  required={key === "name"}
                  maxLength="200"
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <button className="btn btn-primary" disabled={busy}>
              <Save size={16} />
              Simpan profil
            </button>
          </form>
        </section>
        <section className="card">
          <div className="section-heading">
            <div>
              <h3>Ganti kata sandi</h3>
              <p>Gunakan minimal 8 karakter.</p>
            </div>
            <LockKeyhole size={21} />
          </div>
          <form onSubmit={password}>
            {[
              ["currentPassword", "Kata sandi saat ini", "current-password"],
              ["newPassword", "Kata sandi baru", "new-password"],
              ["confirmation", "Konfirmasi kata sandi baru", "new-password"],
            ].map(([key, label, complete]) => (
              <div className="form-group" key={key}>
                <label className="form-label" htmlFor={"pw-" + key}>
                  {label}
                </label>
                <input
                  id={"pw-" + key}
                  className="form-input"
                  type="password"
                  autoComplete={complete}
                  value={pw[key]}
                  required
                  minLength={key === "currentPassword" ? 1 : 8}
                  maxLength="128"
                  onChange={(e) => setPw({ ...pw, [key]: e.target.value })}
                />
              </div>
            ))}
            <button className="btn btn-primary" disabled={busy}>
              <ShieldCheck size={16} />
              Perbarui kata sandi
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
