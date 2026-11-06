import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  CalendarCheck,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Calendar
} from 'lucide-react';

export default function InternHistory({ showToast }) {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const query = `?month=${selectedMonth}&year=${selectedYear}`;
      const res = await api.getMyHistory(query);
      if (res.success) {
        setAttendances(res.attendances);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat riwayat presensi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth, selectedYear]);

  const formatDistance = (m) => {
    if (m === null || m === undefined) return '-';
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${Math.round(m)} m`;
  };

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const years = [2025, 2026, 2027];

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div className="card-title">
              <CalendarCheck size={20} color="var(--aviation-sky)" />
              <span>Log Riwayat Kehadiran Pribadi</span>
            </div>
            <div className="card-subtitle">
              Catatan lengkap waktu kedatangan, kepulangan, jarak GPS, dan ringkasan tugas harian.
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select
                className="form-select"
                style={{ padding: '7px 12px', fontSize: '13px', width: 'auto' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <select
              className="form-select"
              style={{ padding: '7px 12px', fontSize: '13px', width: 'auto' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            Memuat data kehadiran...
          </div>
        ) : attendances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            Tidak ada catatan absensi pada periode bulan yang dipilih.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jam Masuk & Status</th>
                  <th>Jarak Masuk</th>
                  <th>Jam Pulang & Status</th>
                  <th>Jarak Pulang</th>
                  <th>Laporan Tugas Harian</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{item.date}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px' }}>{item.check_in_time || '-'}</span>
                        {item.check_in_status && (
                          <span className={`badge ${item.check_in_status === 'on_time' ? 'badge-on_time' : 'badge-late'}`}>
                            {item.check_in_status === 'on_time' ? 'Tepat Waktu' : 'Terlambat'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {formatDistance(item.check_in_distance)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px' }}>{item.check_out_time || '-'}</span>
                        {item.check_out_status && (
                          <span className={`badge ${item.check_out_status === 'on_time' ? 'badge-on_time' : 'badge-late'}`}>
                            {item.check_out_status === 'on_time' ? 'Normal' : 'Pulang Awal'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {formatDistance(item.check_out_distance)}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>
                        {item.daily_report || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Tidak ada catatan tugas.</span>}
                      </div>
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
