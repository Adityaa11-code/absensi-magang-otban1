import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Users,
  ClipboardList,
  MapPin,
  BarChart3,
  LogOut,
  X,
  BookOpen,
  Megaphone,
  UserRound,
  ArrowUpRight,
} from "lucide-react";
export default function Sidebar({ currentTab, setTab, isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const admin = user.role === "admin";
  const items = admin
    ? [
        ["admin-dashboard", LayoutDashboard, "Ringkasan"],
        ["admin-interns", Users, "Peserta magang"],
        ["admin-monitoring", ClipboardList, "Presensi & izin"],
        ["logbooks", BookOpen, "Ulasan logbook"],
        ["admin-reports", BarChart3, "Rekap & laporan"],
      ]
    : [
        ["dashboard", LayoutDashboard, "Dashboard"],
        ["history", CalendarCheck, "Riwayat presensi"],
        ["leaves", FileText, "Izin & sakit"],
        ["logbooks", BookOpen, "Logbook harian"],
      ];
  function nav(key) {
    setTab(key);
    setIsOpen(false);
  }
  return (
    <>
      {isOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />
      )}
      <aside className={"sidebar " + (isOpen ? "open" : "")}>
        <div className="sidebar-header">
          <img src="/logo-otban.png" alt="Logo Otban I" width="40" />
          <div>
            <div className="sidebar-brand-title">
              OTBAN I<span className="brand-dot">.</span>
            </div>
            <div className="sidebar-brand-sub">Internship portal</div>
          </div>
          <button
            className="sidebar-close"
            aria-label="Tutup menu"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="live-dot" />
          {admin ? "Ruang kerja pembina" : "Ruang kerja peserta"}
          <span className="workspace-tag">{admin ? "ADMIN" : "MAGANG"}</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">MENU UTAMA</div>
          {items.map(([key, Icon, label]) => (
            <button
              key={key}
              className={"nav-item " + (currentTab === key ? "active" : "")}
              aria-current={currentTab === key ? "page" : undefined}
              onClick={() => nav(key)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {currentTab === key && <span className="nav-active-dot" />}
            </button>
          ))}
          <div className="nav-section-title">INFORMASI & AKUN</div>
          {[
            ["announcements", Megaphone, "Pengumuman"],
            ...(admin ? [["admin-settings", MapPin, "Pengaturan kantor"]] : []),
            ["profile", UserRound, "Profil & keamanan"],
          ].map(([key, Icon, label]) => (
            <button
              key={key}
              className={"nav-item " + (currentTab === key ? "active" : "")}
              onClick={() => nav(key)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <BookOpen size={22} />
          <strong>Setiap hari, satu langkah maju.</strong>
          <p>
            {admin
              ? "Dampingi proses belajar dan apresiasi perkembangan peserta."
              : "Dokumentasikan pengalamanmu melalui logbook harian."}
          </p>
          <button onClick={() => nav("logbooks")}>
            Buka logbook <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {user.name
                .split(" ")
                .slice(0, 2)
                .map((x) => x[0])
                .join("")}
            </div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">
                {admin ? "Admin / Pembina" : "Peserta magang"}
              </div>
            </div>
            <button
              className="logout-icon"
              aria-label="Keluar akun"
              onClick={logout}
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
