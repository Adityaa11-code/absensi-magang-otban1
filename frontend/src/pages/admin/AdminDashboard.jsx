import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Check,
  X,
  Building2,
  Calendar
} from 'lucide-react';

export default function AdminDashboard({ showToast, setTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat ringkasan dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleVerifyLeave = async (id, status) => {
    try {
      const res = await api.verifyLeave(id, { status, adminNotes: status === 'approved' ? 'Disetujui oleh Pembina.' : 'Ditolak.' });
      if (res.success) {
        showToast(res.message, 'success');
        fetchDashboard();
      }
    } catch (err) {
      showToast(err.message || 'Gagal memverifikasi izin.', 'error');
    }
  };

  const stats = data?.stats;
  const recentAttendances = data?.recentAttendances || [];
  const recentPendingLeaves = data?.recentPendingLeaves || [];

  return (
    <div>
      {/* Top Banner Overview */}
      <div style={{
        background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)',
        borderRadius: 'var(--radius-lg)',
        color: '#ffffff',
        padding: '28px 32px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
            <Building2 size={16} />
            <span>KANTOR OTORITAS BANDAR UDARA WILAYAH I</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            Dashboard Pemantauan Presensi Magang
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '4px' }}>
            Pantau kehadiran, kedisiplinan waktu, dan pengajuan izin seluruh peserta magang secara terpusat.
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Calendar size={20} color="#7dd3fc" />
          <div>
            <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>Periode Hari Ini</div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{stats?.date || '-'}</div>
          </div>
        </div>
      </div>

      {/* Grid Kartu Statistik */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div>
            <div className="stat-info-title">Peserta Magang Aktif</div>
            <div className="stat-info-value">{stats?.totalInterns || 0}</div>
          </div>
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card green">
          <div>
            <div className="stat-info-title">Hadir Hari Ini</div>
            <div className="stat-info-value">{stats?.presentToday || 0}</div>
          </div>
          <div className="stat-icon green">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card yellow">
          <div>
            <div className="stat-info-title">Terlambat Hari Ini</div>
            <div className="stat-info-value">{stats?.lateToday || 0}</div>
          </div>
          <div className="stat-icon yellow">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card purple">
          <div>
            <div className="stat-info-title">Izin / Sakit</div>
            <div className="stat-info-value">{stats?.leaveToday || 0}</div>
          </div>
          <div className="stat-icon purple">
            <FileText size={24} />
          </div>
        </div>

        <div className="stat-card red">
          <div>
            <div className="stat-info-title">Belum Presensi</div>
            <div className="stat-info-value">{stats?.notPresentToday || 0}</div>
          </div>
          <div className="stat-icon red">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* 2 Kolom: Live Attendances Feed vs Pending Leaves */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
        {/* Kolom 1: Live Log Hari Ini */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <CheckCircle2 size={20} color="var(--aviation-sky)" />
                <span>Aktivitas Presensi Hari Ini</span>
              </div>
              <div className="card-subtitle">
                Daftar peserta yang baru saja melakukan absensi masuk atau pulang.
              </div>
            </div>

            <button
              onClick={() => setTab('admin-monitoring')}
              className="btn btn-outline btn-sm"
            >
              <span>Semua Log</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Memuat aktivitas...</div>
          ) : recentAttendances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Belum ada peserta yang melakukan presensi hari ini.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Peserta</th>
                    <th>Divisi Otban 1</th>
                    <th>Masuk</th>
                    <th>Pulang</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendances.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{item.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>NIM: {item.nim || '-'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.division}>
                          {item.division}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700 }}>{item.check_in_time || '-'}</span>
                          {item.check_in_status && (
                            <span className={`badge ${item.check_in_status === 'on_time' ? 'badge-on_time' : 'badge-late'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                              {item.check_in_status === 'on_time' ? 'Tepat' : 'Telat'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{item.check_out_time || '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Kolom 2: Pengajuan Izin Membutuhkan Review */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <FileText size={20} color="var(--warning)" />
                <span>Persetujuan Izin & Sakit ({recentPendingLeaves.length})</span>
              </div>
              <div className="card-subtitle">
                Permohonan izin baru dari peserta magang yang memerlukan persetujuan.
              </div>
            </div>

            <button
              onClick={() => setTab('admin-monitoring')}
              className="btn btn-outline btn-sm"
            >
              <span>Kelola Izin</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Memuat permohonan...</div>
          ) : recentPendingLeaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Tidak ada permohonan izin yang menunggu persetujuan saat ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {recentPendingLeaves.map((l) => (
                <div
                  key={l.id}
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-dark)' }}>{l.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {l.division} &bull; {l.institution}
                      </div>
                    </div>
                    <span className={`badge badge-${l.type}`}>{l.type.toUpperCase()}</span>
                  </div>

                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <strong>Periode:</strong> {l.start_date} {l.start_date !== l.end_date && `s.d. ${l.end_date}`}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px', background: '#ffffff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    &ldquo;{l.reason}&rdquo;
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => handleVerifyLeave(l.id, 'rejected')}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <X size={14} />
                      <span>Tolak</span>
                    </button>
                    <button
                      onClick={() => handleVerifyLeave(l.id, 'approved')}
                      className="btn btn-success btn-sm"
                    >
                      <Check size={14} />
                      <span>Setujui</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
