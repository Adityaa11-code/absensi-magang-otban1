import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Navigation,
  Compass,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function InternDashboard({ showToast }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState(null);
  const [stats, setStats] = useState(null);

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Geolocation state
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isInsideRadius, setIsInsideRadius] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Check-out modal & daily report state
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [dailyReport, setDailyReport] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's status & stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [todayRes, statsRes] = await Promise.all([
        api.getTodayStatus(),
        api.getMyStats(),
      ]);

      if (todayRes.success) {
        setTodayData(todayRes);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat status absensi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper Haversine untuk kalkulasi langsung di browser
  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // meter
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Deteksi Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Browser Anda tidak mendukung deteksi lokasi (Geolocation).');
      return;
    }

    setDetectingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setCoords({ latitude: userLat, longitude: userLng });

        if (todayData?.settings) {
          const dist = calculateHaversine(
            todayData.settings.officeLat,
            todayData.settings.officeLng,
            userLat,
            userLng
          );
          setDistance(dist);
          setIsInsideRadius(dist <= todayData.settings.radiusMeters);
        }
        setDetectingLocation(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        let msg = 'Izin lokasi GPS ditolak atau tidak dapat diakses.';
        if (error.code === 1) msg = 'Izin akses lokasi ditolak oleh Anda. Mohon izinkan lokasi di browser.';
        if (error.code === 2) msg = 'Posisi lokasi GPS tidak dapat ditentukan.';
        if (error.code === 3) msg = 'Waktu permintaan lokasi habis (timeout).';
        setGeoError(msg);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Trigger deteksi lokasi saat settings sudah dimuat
  useEffect(() => {
    if (todayData?.settings) {
      detectLocation();
    }
  }, [todayData?.settings?.officeLat]);

  const handleCheckIn = async () => {
    try {
      setSubmitting(true);
      const payload = coords || {};
      const res = await api.checkIn(payload);
      if (res.success) {
        showToast(res.message, 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setSubmitting(true);
      const payload = {
        ...(coords || {}),
        dailyReport: dailyReport.trim(),
      };
      const res = await api.checkOut(payload);
      if (res.success) {
        showToast(res.message, 'success');
        setShowCheckOutModal(false);
        setDailyReport('');
        fetchData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDistance = (m) => {
    if (m === null || m === undefined) return '-';
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${Math.round(m)} meter`;
  };

  const attendance = todayData?.attendance;
  const settings = todayData?.settings;
  const activeLeave = todayData?.activeLeave;

  const hasCheckedIn = Boolean(attendance?.check_in_time);
  const hasCheckedOut = Boolean(attendance?.check_out_time);

  return (
    <div>
      {/* Aviation Banner & Realtime Clock */}
      <div className="banner-attendance">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7dd3fc', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Building2 size={16} />
            <span>{settings?.officeName || 'Kantor Otoritas Bandar Udara Wilayah I'}</span>
          </div>
          <div className="clock-display" style={{ marginTop: '12px' }}>
            {currentTime.toLocaleTimeString('id-ID', { hour12: false })} <span style={{ fontSize: '18px', fontWeight: 600 }}>WIB</span>
          </div>
          <div className="date-display">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Radius Status Widget */}
        <div className="radius-status-box">
          <div className={`pulse-indicator ${!settings?.radiusEnabled || isInsideRadius ? 'inside' : 'outside'}`} />
          <div>
            <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>
              Status Lokasi Presensi
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
              {!settings?.radiusEnabled
                ? 'Mode Bebas Radius (Testing Aktif)'
                : isInsideRadius
                ? 'Di Dalam Area Kantor'
                : 'Di Luar Radius Kantor'}
            </div>
            <div style={{ fontSize: '12px', color: '#e0f2fe', marginTop: '2px' }}>
              Jarak Anda: {formatDistance(distance)} &bull; Batas: {formatDistance(settings?.radiusMeters)}
            </div>
          </div>
          <button
            onClick={detectLocation}
            className="btn btn-outline btn-sm"
            style={{
              marginLeft: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 10px',
            }}
            title="Refresh Deteksi Lokasi GPS"
            disabled={detectingLocation}
          >
            <Compass size={16} className={detectingLocation ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {geoError && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#92400e',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13.5px',
        }}>
          <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
          <div>
            <strong>Peringatan Lokasi GPS:</strong> {geoError}.
            <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
              Pastikan Anda mengizinkan akses lokasi pada browser agar sistem dapat memvalidasi posisi Anda terhadap kantor Otban 1.
            </div>
          </div>
        </div>
      )}

      {/* Main Attendance Action Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Navigation size={20} color="var(--aviation-sky)" />
              <span>Pencatatan Kehadiran Hari Ini</span>
            </div>
            <div className="card-subtitle">
              Jam Masuk Kerja: <strong>{settings?.workStartTime || '08:00'} WIB</strong> &bull; Jam Pulang Kerja: <strong>{settings?.workEndTime || '16:30'} WIB</strong>
            </div>
          </div>

          <div>
            {activeLeave ? (
              <span className="badge badge-info">SEDANG IZIN / SAKIT</span>
            ) : hasCheckedIn && hasCheckedOut ? (
              <span className="badge badge-on_time">SELESAI KERJA HARI INI</span>
            ) : hasCheckedIn ? (
              <span className="badge badge-pending">SEDANG BERAKTIVITAS</span>
            ) : (
              <span className="badge badge-danger">BELUM ABSEN MASUK</span>
            )}
          </div>
        </div>

        {activeLeave ? (
          <div style={{
            background: 'var(--info-bg)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary-dark)',
          }}>
            <h4 style={{ color: 'var(--aviation-sky)', marginBottom: '6px' }}>Status Hari Ini: Izin / Sakit</h4>
            <p style={{ fontSize: '14px' }}>
              Anda memiliki permohonan <strong>{activeLeave.type.toUpperCase()}</strong> yang telah disetujui untuk periode{' '}
              <strong>{activeLeave.start_date} s.d. {activeLeave.end_date}</strong>. Anda tidak perlu melakukan presensi hari ini.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Box Absen Masuk */}
            <div style={{
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              background: hasCheckedIn ? '#f0fdf4' : '#ffffff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>ABSEN MASUK</span>
                {hasCheckedIn && (
                  <span className={`badge ${attendance.check_in_status === 'on_time' ? 'badge-on_time' : 'badge-late'}`}>
                    {attendance.check_in_status === 'on_time' ? 'Tepat Waktu' : 'Terlambat'}
                  </span>
                )}
              </div>

              {hasCheckedIn ? (
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    {attendance.check_in_time} <span style={{ fontSize: '14px', fontWeight: 600 }}>WIB</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Tercatat pada jarak: {formatDistance(attendance.check_in_distance)} dari kantor
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Silakan klik tombol di bawah untuk mencatat jam kedatangan Anda di Kantor Otoritas Bandara Wilayah I.
                  </p>
                  <button
                    onClick={handleCheckIn}
                    disabled={submitting || (settings?.radiusEnabled && !isInsideRadius)}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{submitting ? 'Mencatat...' : 'Absen Masuk Sekarang'}</span>
                  </button>
                  {settings?.radiusEnabled && !isInsideRadius && (
                    <div style={{ fontSize: '11.5px', color: 'var(--danger)', marginTop: '8px', textAlign: 'center' }}>
                      Tombol terkunci: Anda berada di luar radius kantor ({formatDistance(distance)}).
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Box Absen Pulang */}
            <div style={{
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              background: hasCheckedOut ? '#f0fdf4' : '#ffffff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>ABSEN PULANG</span>
                {hasCheckedOut && (
                  <span className={`badge ${attendance.check_out_status === 'on_time' ? 'badge-on_time' : 'badge-late'}`}>
                    {attendance.check_out_status === 'on_time' ? 'Normal' : 'Pulang Awal'}
                  </span>
                )}
              </div>

              {hasCheckedOut ? (
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    {attendance.check_out_time} <span style={{ fontSize: '14px', fontWeight: 600 }}>WIB</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Tercatat pada jarak: {formatDistance(attendance.check_out_distance)} dari kantor
                  </div>
                  {attendance.daily_report && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '12.5px' }}>
                      <strong>Laporan Harian:</strong> {attendance.daily_report}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {!hasCheckedIn
                      ? 'Harap lakukan Absen Masuk terlebih dahulu sebelum mencatat Absen Pulang.'
                      : 'Isi ringkasan kegiatan harian yang Anda kerjakan sebelum melakukan Absen Pulang.'}
                  </p>
                  <button
                    onClick={() => setShowCheckOutModal(true)}
                    disabled={!hasCheckedIn || submitting || (settings?.radiusEnabled && !isInsideRadius)}
                    className="btn btn-success"
                    style={{ width: '100%' }}
                  >
                    <ArrowRight size={18} />
                    <span>Absen Pulang & Kirim Laporan</span>
                  </button>
                  {settings?.radiusEnabled && !isInsideRadius && hasCheckedIn && (
                    <div style={{ fontSize: '11.5px', color: 'var(--danger)', marginTop: '8px', textAlign: 'center' }}>
                      Tombol terkunci: Anda berada di luar radius kantor ({formatDistance(distance)}).
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Stats Grid */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--primary-dark)' }}>
        Ringkasan Kehadiran Anda Bulan Ini
      </h3>
      <div className="stats-grid">
        <div className="stat-card blue">
          <div>
            <div className="stat-info-title">Total Hadir</div>
            <div className="stat-info-value">{stats?.totalPresent || 0}</div>
          </div>
          <div className="stat-icon blue">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card green">
          <div>
            <div className="stat-info-title">Tepat Waktu</div>
            <div className="stat-info-value">{stats?.onTime || 0}</div>
          </div>
          <div className="stat-icon green">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="stat-card yellow">
          <div>
            <div className="stat-info-title">Terlambat</div>
            <div className="stat-info-value">{stats?.late || 0}</div>
          </div>
          <div className="stat-icon yellow">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card purple">
          <div>
            <div className="stat-info-title">Izin / Sakit</div>
            <div className="stat-info-value">{(stats?.sickCount || 0) + (stats?.permissionCount || 0)}</div>
          </div>
          <div className="stat-icon purple">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Modal Absen Pulang & Catatan Kegiatan Harian */}
      {showCheckOutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '17px' }}>Konfirmasi Absen Pulang & Kegiatan Harian</h3>
              <button
                onClick={() => setShowCheckOutModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Waktu pulang Anda akan dicatat pada pukul <strong>{currentTime.toLocaleTimeString('id-ID')} WIB</strong>.
                Silakan tulis ringkasan pekerjaan atau tugas yang Anda selesaikan hari ini di Otban 1:
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="dailyReport">Ringkasan Kegiatan Harian (Opsional tapi disarankan)</label>
                <textarea
                  id="dailyReport"
                  className="form-textarea"
                  placeholder="Contoh: Mengarsipkan dokumen kelaikudaraan pesawat di ruang arsip, mengikuti inspeksi ramp check di apron Terminal 3 bersama pembimbing."
                  value={dailyReport}
                  onChange={(e) => setDailyReport(e.target.value)}
                  rows={4}
                />
              </div>

              {settings?.radiusEnabled && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  📍 Koordinat & Jarak: Terdeteksi {formatDistance(distance)} dari titik pusat kantor.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowCheckOutModal(false)}
                className="btn btn-outline"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCheckOut}
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : 'Konfirmasi Absen Pulang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
