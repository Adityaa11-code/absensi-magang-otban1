import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  FileText,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Paperclip
} from 'lucide-react';

export default function InternLeave({ showToast }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('sakit');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.getMyLeaves();
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
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      showToast('Harap lengkapi semua kolom formulir izin.', 'error');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showToast('Tanggal mulai tidak boleh melebihi tanggal selesai.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('type', type);
      formData.append('reason', reason.trim());
      if (file) {
        formData.append('attachment', file);
      }

      const res = await api.applyLeave(formData);
      if (res.success) {
        showToast(res.message, 'success');
        setStartDate('');
        setEndDate('');
        setReason('');
        setFile(null);
        // Reset file input element if needed
        fetchLeaves();
      }
    } catch (err) {
      showToast(err.message || 'Gagal mengajukan izin.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pengajuan izin ini?')) return;
    try {
      const res = await api.cancelLeave(id);
      if (res.success) {
        showToast(res.message, 'success');
        fetchLeaves();
      }
    } catch (err) {
      showToast(err.message || 'Gagal membatalkan perizinan.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
        {/* Formulir Pengajuan Izin */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <FileText size={20} color="var(--aviation-sky)" />
                <span>Formulir Permohonan Izin / Sakit</span>
              </div>
              <div className="card-subtitle">
                Isi data dan lampirkan surat keterangan dokter atau izin akademik.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="type">Kategori Permohonan</label>
              <select
                id="type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="sakit">Sakit (Dengan/Tanpa Surat Dokter)</option>
                <option value="izin">Izin Keperluan Akademik Kampus</option>
                <option value="dispensasi">Dispensasi Kegiatan Luar Kantor</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="startDate">Tanggal Mulai</label>
                <input
                  id="startDate"
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="endDate">Tanggal Selesai</label>
                <input
                  id="endDate"
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reason">Alasan Lengkap / Keterangan</label>
              <textarea
                id="reason"
                className="form-textarea"
                placeholder="Jelaskan alasan izin secara detail dan sopan..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fileUpload">Lampiran Bukti (Opsional / Surat Dokter / PDF / Foto)</label>
              <input
                id="fileUpload"
                type="file"
                className="form-input"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Mendukung file Gambar (JPG, PNG) atau PDF (Maksimal 5 MB).
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={submitting}
            >
              <Upload size={18} />
              <span>{submitting ? 'Mengirim Permohonan...' : 'Kirim Pengajuan Izin'}</span>
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Pengajuan Izin */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Clock size={20} color="var(--aviation-sky)" />
                <span>Riwayat Status Permohonan</span>
              </div>
              <div className="card-subtitle">
                Pantau proses verifikasi dan persetujuan dari Admin Pembina.
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Memuat data permohonan...
            </div>
          ) : leaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Belum ada riwayat permohonan izin atau sakit.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Periode Tanggal</th>
                    <th>Alasan</th>
                    <th>Lampiran</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span className={`badge badge-${l.type}`}>
                          {l.type.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {l.start_date} {l.start_date !== l.end_date && `s.d. ${l.end_date}`}
                        </div>
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ fontSize: '13px' }}>{l.reason}</div>
                        {l.admin_notes && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', background: '#f1f5f9', padding: '4px 6px', borderRadius: '4px' }}>
                            <strong>Catatan Admin:</strong> {l.admin_notes}
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
                            style={{ padding: '4px 8px', fontSize: '11.5px', gap: '4px' }}
                          >
                            <Paperclip size={13} />
                            <span>Lihat Berkas</span>
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
                        {l.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(l.id)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '4px 8px' }}
                            title="Batalkan Pengajuan"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
