import React from "react";
import { Menu, Calendar, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
export default function Navbar({ pageTitle, onToggleSidebar }) {
  const { user } = useAuth();
  return (
    <header className="top-navbar">
      <div className="navbar-heading">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <div className="breadcrumb">
            Portal magang <span>/</span>{" "}
            {user.role === "admin" ? "Administrasi" : "Peserta"}
          </div>
          <h1 className="navbar-page-title">{pageTitle}</h1>
        </div>
      </div>
      <div className="navbar-right">
        <div className="navbar-date">
          <Calendar size={16} />
          {new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Jakarta",
          }).format(new Date())}
        </div>
        <span className="access-badge">
          <ShieldCheck size={15} />
          {user.role === "admin" ? "Admin" : "Peserta"}
        </span>
        <div className="header-avatar" title={user.name}>
          {user.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}
