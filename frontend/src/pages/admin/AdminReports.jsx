import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Building2
} from 'lucide-react';

const OTBAN_DIVISIONS = [
  'Divisi Kelaikudaraan & Pengoperasian Pesawat Udara',
  'Divisi Pelayanan & Pengoperasian Bandar Udara',
  'Divisi Keamanan Penerbangan',
  'Bagian Tata Usaha & Kepegawaian',
  'Subbagian Hukum & Humas',
];

export default function AdminReports({ showToast }) {
  // Default range: awal bulan s.d. hari ini
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const defaultStart = `${year}-${month}-01`;
  const defaultEnd = `${year}-${month}-${day}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [division, setDivision] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    if (!startDate || !endDate) {
      showToast('Tentukan tanggal mulai dan selesai.', 'error');
      return;
    }

    try {
      setLoading(true);
      let query = `?startDate=${startDate}&endDate=${endDate}`;
      if (division) query += `&division=${encodeURIComponent(division)}`;

      const res = await api.getReports(query);
      if (res.success) {
        setReportData(res.report || []);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat rekapitulasi laporan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      showToast('Tidak ada data yang dapat diekspor.', 'error');
      return;
    }

    // Buat header CSV
    const headers = ['No', 'Nama Peserta Magang', 'NIM/NISN', 'Institusi/Kampus', 'Divisi Otban 1', 'Total Hadir', 'Tepat Waktu', 'Terlambat', 'Sakit', 'Izin'];
    const rows = reportData.map((item, index) => [
      index + 1,
      `"${item.name}"`,
      `"${item.nim}"`,
      `"${item.institution}"`,
      `"${item.division}"`,
      item.totalHadir,
      item.tepatWaktu,
      item.terlambat,
      item.sakit,
      item.izin,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Absensi_Otban1_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Rekapitulasi berhasil diunduh.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div className="card-title">
              <BarChart3 size={20} color="var(--aviation-sky)" />
              <span>Rekapitulasi & Laporan Kehadiran</span>
            </div>
            <div className="card-subtitle">
              Laporan akumulasi absensi masuk, keterlambatan, sakit, dan izin peserta magang Otban 1.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleExportCSV} className="btn btn-outline" style={{ gap: '6px' }}>
              <Download size={16} color="var(--success)" />
              <span>Ekspor ke Excel / CSV</span>
            </button>
            <button onClick={handlePrint} className="btn btn-outline" style={{ gap: '6px' }}>
              <Printer size={16} />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Tanggal Mulai</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Tanggal Selesai</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div style={{ minWidth: '220px' }}>
            <label className="form-label">Divisi Penempatan</label>
            <select
              className="form-select"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
            >
              <option value="">Semua Divisi</option>
              {OTBAN_DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
            <Filter size={16} />
            <span>Tampilkan Rekap</span>
          </button>
        </form>

        {/* Tabel Rekapitulasi */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Menyusun data rekapitulasi...</div>
        ) : reportData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Tidak ada data peserta pada periode ini.</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Peserta Magang</th>
                  <th>Institusi / Kampus</th>
                  <th>Divisi Otban 1</th>
                  <th style={{ textAlign: 'center' }}>Total Hadir</th>
                  <th style={{ textAlign: 'center' }}>Tepat Waktu</th>
                  <th style={{ textAlign: 'center' }}>Terlambat</th>
                  <th style={{ textAlign: 'center' }}>Sakit</th>
                  <th style={{ textAlign: 'center' }}>Izin</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--primary-dark)' }}>{row.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>NIM: {row.nim}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px' }}>{row.institution}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--aviation-sky)', fontWeight: 600 }}>{row.division}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-on_time" style={{ fontSize: '12px' }}>{row.totalHadir} Hari</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>
                      {row.tepatWaktu}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--warning)' }}>
                      {row.terlambat}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--info)' }}>
                      {row.sakit}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--purple)' }}>
                      {row.izin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
