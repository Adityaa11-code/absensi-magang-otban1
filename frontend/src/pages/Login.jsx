import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Eye,
  EyeOff,
  MapPin,
  BookOpenCheck,
  ChartNoAxesCombined,
  Plane,
} from "lucide-react";
export default function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState("intern");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-layout">
      <section className="login-story">
        <div className="login-brand">
          <img src="/logo-otban.png" alt="Logo Otban Wilayah I" />
          <div>
            OTBAN WILAYAH I<small>KANTOR OTORITAS BANDAR UDARA</small>
          </div>
        </div>
        <div className="story-content">
          <span className="eyebrow light">PORTAL MAGANG TERPADU</span>
          <h1>
            Langkah kecil hari ini.
            <br />
            <span>
              Pengalaman besar
              <br />
              untuk masa depan.
            </span>
          </h1>
          <p>
            Ruang kerja digital untuk mencatat kehadiran, mengembangkan
            kompetensi, dan mendampingi perjalanan magang.
          </p>
          <div className="story-features">
            {[
              [
                MapPin,
                "Presensi berbasis lokasi",
                "Kehadiran yang tercatat dengan akurat",
              ],
              [
                BookOpenCheck,
                "Kegiatan yang terdokumentasi",
                "Logbook harian dan umpan balik pembina",
              ],
              [
                ChartNoAxesCombined,
                "Perkembangan yang terukur",
                "Monitoring dan rekap dalam satu tempat",
              ],
            ].map(([Icon, title, desc]) => (
              <div key={title}>
                <span>
                  <Icon size={21} />
                </span>
                <section>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </section>
              </div>
            ))}
          </div>
        </div>
        <footer>
          <Plane size={17} /> Kantor Otoritas Bandar Udara Wilayah I ·
          Soekarno-Hatta
        </footer>
        <div className="flight-orbit" aria-hidden="true" />
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <span className="eyebrow">SELAMAT DATANG KEMBALI</span>
          <h2>Masuk ke portal magang</h2>
          <p className="muted">Satu akun, semua kebutuhan magangmu.</p>
          <div className="role-selector" aria-label="Panduan akses">
            {[
              ["intern", GraduationCap, "Peserta magang"],
              ["admin", ShieldCheck, "Admin / Pembina"],
            ].map(([value, Icon, label]) => (
              <button
                type="button"
                aria-pressed={role === value}
                className={role === value ? "selected" : ""}
                key={value}
                onClick={() => {
                  setRole(value);
                  setError("");
                }}
              >
                <Icon size={19} />
                {label}
              </button>
            ))}
          </div>
          <p className="role-description">
            {role === "admin"
              ? "Kelola peserta, tinjau kegiatan, dan pantau kehadiran."
              : "Catat presensi, kirim logbook, dan pantau perjalanan magangmu."}{" "}
            Hak akses ditentukan oleh akun terdaftar.
          </p>
          {error && (
            <div className="inline-error" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Alamat email
              </label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                autoComplete="username"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Kata sandi
              </label>
              <div className="password-input">
                <input
                  id="login-password"
                  className="form-input"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={
                    visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary login-submit" disabled={busy}>
              {busy ? "Memverifikasi akun…" : "Masuk ke dashboard"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-help">
            <ShieldCheck size={19} />
            <span>
              Belum punya akun atau lupa kata sandi?
              <br />
              <strong>Hubungi admin / pembina magang.</strong>
            </span>
          </div>
          {import.meta.env.DEV && (
            <details className="demo-access">
              <summary>Akun demonstrasi lokal</summary>
              <p>Jalankan seeder terlebih dahulu.</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setEmail(
                    role === "admin" ? "admin@otban1.id" : "magang@otban1.id",
                  );
                  setPassword(
                    role === "admin" ? "AdminOtban2026!" : "MagangOtban2026!",
                  );
                }}
              >
                Isi akun {role === "admin" ? "admin" : "peserta"}
              </button>
            </details>
          )}
          <footer className="login-legal">
            Sistem Informasi Absensi & Kegiatan Magang
            <br />
            Direktorat Jenderal Perhubungan Udara
          </footer>
        </div>
      </section>
    </div>
  );
}
