import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Login from './pages/Login';

// Intern Pages
import InternDashboard from './pages/intern/InternDashboard';
import InternLeave from './pages/intern/InternLeave';
import InternHistory from './pages/intern/InternHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInterns from './pages/admin/AdminInterns';
import AdminMonitoring from './pages/admin/AdminMonitoring';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReports from './pages/admin/AdminReports';

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Setup default tab based on role
  const activeTab = currentTab || (user?.role === 'admin' ? 'admin-dashboard' : 'dashboard');

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--primary-navy)',
        color: '#ffffff',
        fontFamily: 'inherit',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>
            OTBAN WILAYAH I
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Memuat Sistem Informasi Absensi...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login />
        <Toast toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  // Titles mapping
  const titles = {
    'dashboard': 'Dashboard & Presensi Magang',
    'leaves': 'Pengajuan Izin & Sakit',
    'history': 'Riwayat Kehadiran Pribadi',
    'admin-dashboard': 'Ringkasan Dashboard Administrator',
    'admin-interns': 'Manajemen Data Peserta Magang',
    'admin-monitoring': 'Monitoring Presensi & Verifikasi Izin',
    'admin-settings': 'Pengaturan Lokasi Kantor & Radius GPS',
    'admin-reports': 'Rekapitulasi & Laporan Kehadiran',
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={activeTab}
        setTab={setCurrentTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="main-wrapper">
        <Navbar
          pageTitle={titles[activeTab] || 'Sistem Absensi Otban 1'}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="content-body">
          {/* Render Intern Pages */}
          {activeTab === 'dashboard' && <InternDashboard showToast={showToast} />}
          {activeTab === 'leaves' && <InternLeave showToast={showToast} />}
          {activeTab === 'history' && <InternHistory showToast={showToast} />}

          {/* Render Admin Pages */}
          {activeTab === 'admin-dashboard' && <AdminDashboard showToast={showToast} setTab={setCurrentTab} />}
          {activeTab === 'admin-interns' && <AdminInterns showToast={showToast} />}
          {activeTab === 'admin-monitoring' && <AdminMonitoring showToast={showToast} />}
          {activeTab === 'admin-settings' && <AdminSettings showToast={showToast} />}
          {activeTab === 'admin-reports' && <AdminReports showToast={showToast} />}
        </main>
      </div>

      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
