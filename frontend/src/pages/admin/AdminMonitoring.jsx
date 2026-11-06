import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Check,
  X,
  Paperclip,
  Calendar,
  AlertCircle
} from 'lucide-react';

const OTBAN_DIVISIONS = [
  'Divisi Kelaikudaraan & Pengoperasian Pesawat Udara',
  'Divisi Pelayanan & Pengoperasian Bandar Udara',
  'Divisi Keamanan Penerbangan',
  'Bagian Tata Usaha & Kepegawaian',
  'Subbagian Hukum & Humas',
];

export default function AdminMonitoring({ showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'leaves'

  // Data states
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters Attendance
  const [attDate, setAttDate] = useState('');
  const [attDivision, setAttDivision] = useState('');
  const [attSearch, setAttSearch] = useState('');
  const [attStatus, setAttStatus] = useState('');

  // Filters Leaves
  const [leaveStatus, setLeaveStatus] = useState('');
  const [leaveSearch, setLeaveSearch] = useState('');

  // Review Modal state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      let query = '?';
      if (attDate) query += `date=${attDate}&`;
      if (attDivision) query += `division=${encodeURIComponent(attDivision)}&`;
      if (attSearch) query += `search=${encodeURIComponent(attSearch)}&`;
      if (attStatus) query += `status=${attStatus}&`;
      const res = await api.getAllAttendances(query);
      if (res.success) {
        setAttendances(res.attendances);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat log presensi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      let query = '?';
      if (leaveStatus) query += `status=${leaveStatus}&`;
      if (leaveSearch) query += `search=${encodeURIComponent(leaveSearch)}&`;
      const res = await api.getAllLeaves(query);
      if (res.success) {
        setLeaves(res.leaves);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat daftar perizinan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'attendance') {
      fetchAttendances();
    } else {
      fetchLeaves();
    }
  }, [activeSubTab, attDate, attDivision, attStatus, leaveStatus]);

  const handleAttSearchSubmit = (e) => {
    e.preventDefault();
    fetchAttendances();
  };

  const handleLeaveSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeaves();
  };

  const handleOpenReview = (leave, defaultAction = 'approved') => {
    setSelectedLeave(leave);
    setReviewStatus(defaultAction);
    setAdminNotes(defaultAction === 'approved' ? 'Disetujui oleh Pembimbing.' : 'Permohonan ditolak karena alasan belum memenuhi syarat.');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      const res = await api.verifyLeave(selectedLeave.id, {
        status: reviewStatus,
        adminNotes: adminNotes.trim(),
      });
      if (res.success) {
        showToast(res.message, 'success');
        setSelectedLeave(null);
        fetchLeaves();
      }
    } catch (err) {
      showToast(err.message || 'Gagal memverifikasi izin.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDistance = (m) => {
    if (m === null || m === undefined) return '-';
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${Math.round(m)} m`;
  };

  return (
    <div>
      {/* Sub Tabs Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeSubTab === 'attendance' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('attendance')}
        >
          <ClipboardList size={16} />
          <span>Monitoring Log Presensi</span>
        </button>

        <button
          className={`btn ${activeSubTab === 'leaves' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('leaves')}
        >
          <FileText size={16} />
          <span>Verifikasi & Daftar Izin Magang</span>
        </button>
      </div>

      {activeSubTab === 'attendance' ? (
        // Tab 1: Log Presensi
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div className="card-title">
                <ClipboardList size={20} color="var(--aviation-sky)" />
                <span>Seluruh Catatan Kehadiran Peserta</span>
              </div>
              <div className="card-subtitle">
                Pantau kedisiplinan jam datang, jam pulang, jarak GPS saat absen, dan laporan harian.
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <form onSubmit={handleAttSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '220px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Cari nama atau NIM..."
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-outline">Cari</button>
            </form>

            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              title="Filter Tanggal Tertentu"
            />

            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={attDivision}
              onChange={(e) => setAttDivision(e.target.value)}
            >
              <option value="">Semua Divisi</option>
              {OTBAN_DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={attStatus}
              onChange={(e) => setAttStatus(e.target.value)}
            >
              <option value="">Semua Status Masuk</option>
              <option value="on_time">Tepat Waktu</option>
              <option value="late">Terlambat</option>
            </select>

            {(attDate || attDivision || attStatus || attSearch) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setAttDate('');
                  setAttDivision('');
                  setAttSearch('');
                  setAttStatus('');
                }}
              >
                Reset Filter
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Memuat log presensi...</div>
          ) : attendances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Tidak ditemukan log presensi dengan filter saat ini.</div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Peserta Magang</th>
                    <th>Divisi Otban 1</th>
                    <th>Tanggal</th>
                    <th>Jam Masuk & Jarak</th>
                    <th>Jam Pulang & Jarak</th>
                    <th>Laporan Tugas Harian</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--primary-dark)' }}>{item.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>NIM: {item.nim || '-'} &bull; {item.institution}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', maxWidth: '170px' }}>{item.division}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.date}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700 }}>{item.check_in_time || '-'}</span>
                          {item.check_in_status && (
                            <span className={`badge ${item.check_in_status === 'on_time' ? 'badge-on_time' : 'badge-late'}`}>
                              {item.check_in_status === 'on_time' ? 'Tepat' : 'Telat'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Jarak: {formatDistance(item.check_in_distance)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700 }}>{item.check_out_time || '-'}</span>
                          {item.check_out_status && (
                            <span className={`badge ${item.check_out_status === 'on_time' ? 'badge-on_time' : 'badge-late'}`}>
                              {item.check_out_status === 'on_time' ? 'Normal' : 'Awal'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Jarak: {formatDistance(item.check_out_distance)}
                        </div>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '12px' }}>
                          {item.daily_report || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Tab 2: Verifikasi & Permohonan Izin
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div className="card-title">
                <FileText size={20} color="var(--aviation-sky)" />
                <span>Pengelolaan Permohonan Izin & Sakit</span>
              </div>
              <div className="card-subtitle">
                Tinjau surat dokter/kampus dan berikan persetujuan atau penolakan.
              </div>
            </div>
          </div>

          {/* Filters Leaves */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <form onSubmit={handleLeaveSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '220px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Cari nama peserta..."
                  value={leaveSearch}
                  onChange={(e) => setLeaveSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-outline">Cari</button>
            </form>

            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={leaveStatus}
              onChange={(e) => setLeaveStatus(e.target.value)}
            >
              <option value="">Semua Status Persetujuan</option>
              <option value="pending">Menunggu Persetujuan</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Memuat data perizinan...</div>
          ) : leaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Tidak ada data permohonan izin dengan filter ini.</div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Peserta</th>
                    <th>Kategori</th>
                    <th>Periode Tanggal</th>
                    <th>Alasan</th>
                    <th>Lampiran Berkas</th>
                    <th>Status</th>
                    <th>Aksi Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{l.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{l.division}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${l.type}`}>{l.type.toUpperCase()}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {l.start_date} {l.start_date !== l.end_date && `s.d. ${l.end_date}`}
                        </div>
                      </td>
                      <td style={{ maxWidth: '220px' }}>
                        <div style={{ fontSize: '13px' }}>{l.reason}</div>
                        {l.admin_notes && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', background: '#f1f5f9', padding: '4px 6px', borderRadius: '4px' }}>
                            <strong>Catatan:</strong> {l.admin_notes}
                          </div>
                        )}
                      </td>
                      <td>
                        {l.attachment_path ? (
                          <a
                            href={l.attachment_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          >
                            <Paperclip size={13} />
                            <span>Buka Berkas</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${l.status}`}>
                          {l.status === 'approved' ? 'Disetujui' : l.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenReview(l, 'approved')}
                            className="btn btn-success btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Setujui Izin"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenReview(l, 'rejected')}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '5px 8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Tolak Izin"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Review Izin */}
      {selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '17px' }}>Verifikasi Permohonan Izin / Sakit</h3>
              <button onClick={() => setSelectedLeave(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedLeave.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedLeave.division}</div>
                  <div style={{ fontSize: '12.5px', marginTop: '6px' }}>
                    <strong>Periode:</strong> {selectedLeave.start_date} s.d. {selectedLeave.end_date} ({selectedLeave.type.toUpperCase()})
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px', fontStyle: 'italic' }}>
                    &ldquo;{selectedLeave.reason}&rdquo;
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="statusSelect">Keputusan Persetujuan</label>
                  <select
                    id="statusSelect"
                    className="form-select"
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                  >
                    <option value="approved">Setujui Permohonan (Approved)</option>
                    <option value="rejected">Tolak Permohonan (Rejected)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reviewNote">Catatan Pembimbing / Alasan</label>
                  <textarea
                    id="reviewNote"
                    className="form-textarea"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedLeave(null)} className="btn btn-outline" disabled={submittingReview}>
                  Batal
                </button>
                <button type="submit" className={`btn ${reviewStatus === 'approved' ? 'btn-success' : 'btn-danger'}`} disabled={submittingReview}>
                  {submittingReview ? 'Menyimpan...' : 'Simpan Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
