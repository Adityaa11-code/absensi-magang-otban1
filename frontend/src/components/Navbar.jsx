import React from 'react';
import { Menu, Calendar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ pageTitle, onToggleSidebar }) {
  const { user } = useAuth();

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Buka Menu">
          <Menu size={22} />
        </button>
        <div>
          <h1 className="navbar-page-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="navbar-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <Calendar size={16} color="var(--aviation-sky)" />
          <span style={{ fontWeight: 600 }}>{todayFormatted}</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-main)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '12px',
          fontWeight: 700,
          color: user?.role === 'admin' ? 'var(--aviation-sky)' : 'var(--success)',
        }}>
          <ShieldCheck size={14} />
          <span>{user?.role === 'admin' ? 'AKSES ADMIN' : 'PESERTA AKTIF'}</span>
        </div>
      </div>
    </header>
  );
}
