import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  MapPin,
  Compass,
  Sliders,
  CheckCircle2,
  Clock,
  Building2,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';

export default function AdminSettings({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detectingAdminLoc, setDetectingAdminLoc] = useState(false);

  const [settings, setSettings] = useState({
    office_name: '',
    office_address: '',
    office_lat: -6.1265,
    office_lng: 106.6548,
    radius_meters: 350,
    radius_enabled: 1,
    work_start_time: '08:00',
    work_end_time: '16:30',
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success) {
        setSettings(res.settings);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat pengaturan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Browser Anda tidak mendukung deteksi lokasi.', 'error');
      return;
    }

    setDetectingAdminLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings({
          ...settings,
          office_lat: pos.coords.latitude,
          office_lng: pos.coords.longitude,
        });
        showToast('Koordinat lokasi saat ini berhasil diterapkan!', 'success');
        setDetectingAdminLoc(false);
      },
      (err) => {
        showToast('Gagal mendeteksi lokasi: Mohon izinkan akses GPS pada browser.', 'error');
        setDetectingAdminLoc(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        officeName: settings.office_name,
        officeAddress: settings.office_address,
        officeLat: parseFloat(settings.office_lat),
        officeLng: parseFloat(settings.office_lng),
        radiusMeters: parseInt(settings.radius_meters, 10),
        radiusEnabled: Boolean(settings.radius_enabled),
        workStartTime: settings.work_start_time,
        workEndTime: settings.work_end_time,
      };

      const res = await api.updateSettings(payload);
      if (res.success) {
        showToast(res.message, 'success');
        setSettings(res.settings);
      }
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${settings.office_lat},${settings.office_lng}`;

  return (
    <div>
      <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <MapPin size={22} color="var(--aviation-sky)" />
              <span>Pengaturan Titik Lokasi Kantor & Radius Geofencing</span>
            </div>
            <div className="card-subtitle">
              Tentukan batas toleransi jarak (meter/kilometer) untuk presensi kehadiran peserta magang.
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Memuat pengaturan...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Alert Informasi Radius */}
            <div style={{
              background: 'var(--info-bg)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <Info size={20} color="var(--aviation-sky)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: 'var(--primary-dark)', lineHeight: 1.5 }}>
                <strong>Cara Kerja Radius:</strong> Ketika peserta menekan tombol Absen Masuk/Pulang, sistem menghitung jarak GPS peserta terhadap titik koordinat kantor di bawah. Jika melebihi radius yang diatur, absensi otomatis ditolak.
              </div>
            </div>

            {/* Toggle Switch Radius Check Active/Bypass */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-dark)' }}>
                  Wajibkan Validasi Radius (Geofencing GPS)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {settings.radius_enabled
                    ? 'Aktif: Peserta magang WAJIB berada di dalam radius kantor untuk dapat melakukan absensi.'
                    : 'Nonaktif (Mode Uji Coba): Absensi diizinkan dari lokasi manapun tanpa batasan jarak.'}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, radius_enabled: settings.radius_enabled ? 0 : 1 })}
                  className={`btn ${settings.radius_enabled ? 'btn-success' : 'btn-outline'}`}
                  style={{ minWidth: '140px' }}
                >
                  {settings.radius_enabled ? 'STATUS: AKTIF' : 'STATUS: NONAKTIF'}
                </button>
              </div>
            </div>

            {/* Section Kantor */}
            <div className="form-group">
              <label className="form-label" htmlFor="officeName">Nama Instansi / Kantor</label>
              <input
                id="officeName"
                type="text"
                className="form-input"
                value={settings.office_name}
                onChange={(e) => setSettings({ ...settings, office_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="officeAddress">Alamat Lengkap Kantor</label>
              <input
                id="officeAddress"
                type="text"
                className="form-input"
                value={settings.office_address}
                onChange={(e) => setSettings({ ...settings, office_address: e.target.value })}
                required
              />
            </div>

            {/* Koordinat Titik Kantor */}
            <div style={{
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              background: '#ffffff',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  Titik Koordinat Lokasi Kantor
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="btn btn-outline btn-sm"
                    disabled={detectingAdminLoc}
                    style={{ gap: '6px' }}
                  >
                    <Compass size={14} />
                    <span>{detectingAdminLoc ? 'Mendeteksi...' : 'Ambil Lokasi Saya'}</span>
                  </button>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <ExternalLink size={14} />
                    <span>Buka Maps</span>
                  </a>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="officeLat">Latitude (Garis Lintang)</label>
                  <input
                    id="officeLat"
                    type="number"
                    step="any"
                    className="form-input"
                    value={settings.office_lat}
                    onChange={(e) => setSettings({ ...settings, office_lat: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="officeLng">Longitude (Garis Bujur)</label>
                  <input
                    id="officeLng"
                    type="number"
                    step="any"
                    className="form-input"
                    value={settings.office_lng}
                    onChange={(e) => setSettings({ ...settings, office_lng: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Radius Slider / Input */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="radiusMeters" style={{ marginBottom: 0 }}>
                  Batas Radius Toleransi Jarak
                </label>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--aviation-sky)' }}>
                  {settings.radius_meters >= 1000
                    ? `${(settings.radius_meters / 1000).toFixed(2)} Kilometer (${settings.radius_meters} meter)`
                    : `${settings.radius_meters} Meter`}
                </span>
              </div>

              <input
                id="radiusMeters"
                type="range"
                min="50"
                max="5000"
                step="25"
                style={{ width: '100%', accentColor: 'var(--aviation-sky)', cursor: 'pointer' }}
                value={settings.radius_meters}
                onChange={(e) => setSettings({ ...settings, radius_meters: Number(e.target.value) })}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>50 Meter (Area Ruangan)</span>
                <span>350 Meter (Area Gedung Otban 1)</span>
                <span>1.000 Meter (1 KM Bandara)</span>
                <span>5.000 Meter (5 KM Wilayah)</span>
              </div>
            </div>

            {/* Jam Kerja Kantor */}
            <div style={{
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              background: '#ffffff',
              marginBottom: '24px',
            }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--primary-dark)', display: 'block', marginBottom: '14px' }}>
                Ketentuan Jam Kerja Kantor (WIB)
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="workStart">Batas Jam Masuk (Tepat Waktu)</label>
                  <input
                    id="workStart"
                    type="time"
                    className="form-input"
                    value={settings.work_start_time}
                    onChange={(e) => setSettings({ ...settings, work_start_time: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Absen setelah jam ini otomatis berstatus Terlambat.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="workEnd">Jam Minimal Absen Pulang</label>
                  <input
                    id="workEnd"
                    type="time"
                    className="form-input"
                    value={settings.work_end_time}
                    onChange={(e) => setSettings({ ...settings, work_end_time: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Absen sebelum jam ini berstatus Pulang Awal.
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={submitting}
            >
              <CheckCircle2 size={18} />
              <span>{submitting ? 'Menyimpan Pengaturan...' : 'Simpan Seluruh Pengaturan'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
