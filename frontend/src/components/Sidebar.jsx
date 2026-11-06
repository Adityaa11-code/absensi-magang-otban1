import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plane,
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Users,
  ClipboardList,
  MapPin,
  BarChart3,
  LogOut,
  X,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab, isOpen, setIsOpen }) {
  const { user, logout } = useAuth();

  const handleNavClick = (tabKey) => {
    setTab(tabKey);
    if (window.innerWidth <= 1024) {
      setIsOpen(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-img-wrap">
            <img
              src="/logo-otban.png"
              alt="Logo Otban 1"
              style={{
                height: '42px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))',
              }}
            />
          </div>
          <div>
            <div className="sidebar-brand-title">OTBAN WILAYAH I</div>
            <div className="sidebar-brand-sub">Sistem Absensi Magang</div>
          </div>
          {window.innerWidth <= 1024 && (
            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {!isAdmin ? (
            // Menu Peserta Magang
            <>
              <div className="nav-section-title">Menu Peserta Magang</div>
              <button
                className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard & Absensi</span>
              </button>
              <button
                className={`nav-item ${currentTab === 'leaves' ? 'active' : ''}`}
                onClick={() => handleNavClick('leaves')}
              >
                <FileText size={18} />
                <span>Pengajuan Izin & Sakit</span>
              </button>
              <button
                className={`nav-item ${currentTab === 'history' ? 'active' : ''}`}
                onClick={() => handleNavClick('history')}
              >
                <CalendarCheck size={18} />
                <span>Riwayat Kehadiran</span>
              </button>
            </>
          ) : (
            // Menu Administrator / Pembimbing
            <>
              <div className="nav-section-title">Panel Administrator</div>
              <button
                className={`nav-item ${currentTab === 'admin-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin-dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Ringkasan Dashboard</span>
              </button>
              <button
                className={`nav-item ${currentTab === 'admin-interns' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin-interns')}
              >
                <Users size={18} />
                <span>Data Peserta Magang</span>
              </button>
              <button
                className={`nav-item ${currentTab === 'admin-monitoring' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin-monitoring')}
              >
                <ClipboardList size={18} />
                <span>Monitoring & Izin</span>
              </button>
              <button
                className={`nav-item ${currentTab === 'admin-settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin-settings')}
              >
                <MapPin size={18} />
                <span>Pengaturan Lokasi & Radius</span>
              </button>
              <button
                className={`nav-item ${currentTab === 'admin-reports' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin-reports')}
              >
                <BarChart3 size={18} />
                <span>Rekap & Laporan</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <div className="user-name" title={user?.name}>{user?.name}</div>
              <div className="user-role" title={isAdmin ? 'Administrator Otban 1' : user?.division}>
                {isAdmin ? 'Admin Pembimbing' : (user?.division || 'Peserta Magang')}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-outline btn-sm"
            style={{
              width: '100%',
              marginTop: '12px',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.05)',
            }}
          >
            <LogOut size={16} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
