import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  GraduationCap
} from 'lucide-react';

const OTBAN_DIVISIONS = [
  'Divisi Kelaikudaraan & Pengoperasian Pesawat Udara',
  'Divisi Pelayanan & Pengoperasian Bandar Udara',
  'Divisi Keamanan Penerbangan',
  'Bagian Tata Usaha & Kepegawaian',
  'Subbagian Hukum & Humas',
];

export default function AdminInterns({ showToast }) {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    nim: '',
    institution: '',
    major: '',
    division: OTBAN_DIVISIONS[0],
    phone: '',
    startDate: '',
    endDate: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInterns = async () => {
    try {
      setLoading(true);
      let query = '?';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (selectedDivision) query += `division=${encodeURIComponent(selectedDivision)}&`;
      const res = await api.getAllInterns(query);
      if (res.success) {
        setInterns(res.interns);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat data peserta magang.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, [selectedDivision]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInterns();
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: 'MagangOtban2026!',
      nim: '',
      institution: '',
      major: '',
      division: OTBAN_DIVISIONS[0],
      phone: '',
      startDate: '',
      endDate: '',
    });
    setShowAddModal(true);
  };

  const handleCreateIntern = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.createIntern(formData);
      if (res.success) {
        showToast(res.message, 'success');
        setShowAddModal(false);
        fetchInterns();
      }
    } catch (err) {
      showToast(err.message || 'Gagal menambahkan peserta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (intern) => {
    setSelectedIntern(intern);
    setFormData({
      name: intern.name,
      email: intern.email,
      nim: intern.nim || '',
      institution: intern.institution || '',
      major: intern.major || '',
      division: intern.division || OTBAN_DIVISIONS[0],
      phone: intern.phone || '',
      startDate: intern.start_date || '',
      endDate: intern.end_date || '',
      status: intern.status,
    });
    setShowEditModal(true);
  };

  const handleUpdateIntern = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.updateIntern(selectedIntern.id, formData);
      if (res.success) {
        showToast(res.message, 'success');
        setShowEditModal(false);
        fetchInterns();
      }
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui data peserta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (intern) => {
    const newStatus = intern.status === 'active' ? 'inactive' : 'active';
    const confirmMsg = intern.status === 'active'
      ? `Nonaktifkan akun ${intern.name}? Peserta ini tidak akan dapat login.`
      : `Aktifkan kembali akun ${intern.name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.updateIntern(intern.id, { status: newStatus });
      if (res.success) {
        showToast(`Status akun berhasil diubah menjadi ${newStatus}.`, 'success');
        fetchInterns();
      }
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status.', 'error');
    }
  };

  const handleOpenReset = (intern) => {
    setSelectedIntern(intern);
    setNewPassword('MagangOtban2026!');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.resetInternPassword(selectedIntern.id, { newPassword });
      if (res.success) {
        showToast(res.message, 'success');
        setShowResetModal(false);
      }
    } catch (err) {
      showToast(err.message || 'Gagal mereset kata sandi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIntern = async (intern) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus permanen data peserta magang ${intern.name}? Seluruh catatan absensi peserta ini juga akan terhapus.`)) return;

    try {
      const res = await api.deleteIntern(intern.id);
      if (res.success) {
        showToast(res.message, 'success');
        fetchInterns();
      }
    } catch (err) {
      showToast(err.message || 'Gagal menghapus peserta.', 'error');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div className="card-title">
              <Users size={20} color="var(--aviation-sky)" />
              <span>Data & Manajemen Peserta Magang</span>
            </div>
            <div className="card-subtitle">
              Kelola profil mahasiswa/pelajar magang, divisi penempatan, dan akses login.
            </div>
          </div>

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <UserPlus size={18} />
            <span>Tambah Peserta Magang</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Cari nama, NIM, email, atau kampus..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-outline">
              Cari
            </button>
          </form>

          <div style={{ minWidth: '220px' }}>
            <select
              className="form-select"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              <option value="">Semua Divisi Otban 1</option>
              {OTBAN_DIVISIONS.map((div) => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel Data Peserta */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Memuat peserta magang...</div>
        ) : interns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Tidak ditemukan data peserta magang.</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nama & Kontak</th>
                  <th>NIM / Institusi</th>
                  <th>Divisi Penempatan</th>
                  <th>Periode Magang</th>
                  <th>Status Akun</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {interns.map((intern) => (
                  <tr key={intern.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-dark)' }}>{intern.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{intern.email}</div>
                      {intern.phone && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>WA: {intern.phone}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{intern.nim || '-'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{intern.institution || '-'}</div>
                      {intern.major && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{intern.major}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--aviation-sky)' }}>
                        {intern.division}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {intern.start_date || '-'} <br />s.d. {intern.end_date || '-'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${intern.status}`}>
                        {intern.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(intern)}
                          className="btn btn-outline btn-sm"
                          title="Edit Data"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenReset(intern)}
                          className="btn btn-outline btn-sm"
                          title="Reset Password"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(intern)}
                          className="btn btn-outline btn-sm"
                          style={{ color: intern.status === 'active' ? 'var(--warning)' : 'var(--success)' }}
                          title={intern.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {intern.status === 'active' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteIntern(intern)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="Hapus Permanen"
                        >
                          <Trash2 size={14} />
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

      {/* Modal Tambah Peserta Baru */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '17px' }}>Tambah Peserta Magang Baru</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleCreateIntern}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="newName">Nama Lengkap</label>
                  <input
                    id="newName"
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="newEmail">Alamat Email</label>
                    <input
                      id="newEmail"
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newPass">Kata Sandi Awal</label>
                    <input
                      id="newPass"
                      type="text"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="newNim">NIM / NISN</label>
                    <input
                      id="newNim"
                      type="text"
                      className="form-input"
                      value={formData.nim}
                      onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newPhone">No. WhatsApp / HP</label>
                    <input
                      id="newPhone"
                      type="text"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="newInst">Asal Kampus / Sekolah</label>
                    <input
                      id="newInst"
                      type="text"
                      className="form-input"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newMajor">Program Studi / Jurusan</label>
                    <input
                      id="newMajor"
                      type="text"
                      className="form-input"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newDiv">Divisi Penempatan di Otban 1</label>
                  <select
                    id="newDiv"
                    className="form-select"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  >
                    {OTBAN_DIVISIONS.map((div) => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="newStart">Tanggal Mulai Magang</label>
                    <input
                      id="newStart"
                      type="date"
                      className="form-input"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newEnd">Tanggal Selesai Magang</label>
                    <input
                      id="newEnd"
                      type="date"
                      className="form-input"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" disabled={submitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan Peserta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Peserta */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '17px' }}>Edit Data Peserta Magang</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleUpdateIntern}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="editName">Nama Lengkap</label>
                  <input
                    id="editName"
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editEmail">Email</label>
                    <input
                      id="editEmail"
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="editNim">NIM / NISN</label>
                    <input
                      id="editNim"
                      type="text"
                      className="form-input"
                      value={formData.nim}
                      onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editInst">Asal Kampus / Sekolah</label>
                    <input
                      id="editInst"
                      type="text"
                      className="form-input"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="editMajor">Jurusan</label>
                    <input
                      id="editMajor"
                      type="text"
                      className="form-input"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="editDiv">Divisi Penempatan</label>
                  <select
                    id="editDiv"
                    className="form-select"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  >
                    {OTBAN_DIVISIONS.map((div) => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline" disabled={submitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '17px' }}>Reset Kata Sandi</h3>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Reset kata sandi untuk akun <strong>{selectedIntern?.name}</strong>:
                </p>
                <div className="form-group">
                  <label className="form-label" htmlFor="resetPass">Kata Sandi Baru</label>
                  <input
                    id="resetPass"
                    type="text"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Mereset...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
