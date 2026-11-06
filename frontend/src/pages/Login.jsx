import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plane, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Silakan isi email dan kata sandi Anda.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a192f 0%, #0f172a 50%, #1e3a8a 100%)',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Decorative Aviation Ambient Pattern */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 10,
      }}>
        {/* Header Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '36px 32px 30px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <img
            src="/logo-otban.png"
            alt="Logo Resmi Kantor Otoritas Bandar Udara Wilayah I"
            style={{
              height: '88px',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              margin: '0 auto 14px',
              display: 'block',
              filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45))',
            }}
          />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
            OTBAN WILAYAH I
          </h2>
          <p style={{ fontSize: '13px', color: '#93c5fd', marginTop: '4px', fontWeight: 500 }}>
            Sistem Informasi Absensi Peserta Magang
          </p>
          <div style={{
            display: 'inline-block',
            marginTop: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#e2e8f0',
            letterSpacing: '0.5px',
          }}>
            KANTOR OTORITAS BANDAR UDARA WILAYAH I - KELAS UTAMA
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '32px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Alamat Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="nama@otban1.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{
              fontSize: '11.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '10px',
              textAlign: 'center',
              letterSpacing: '0.5px',
            }}>
              Akun Uji Coba Cepat (Klik untuk Mengisi):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('magang@otban1.id', 'MagangOtban2026!')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', padding: '8px', gap: '2px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  <UserCheck size={14} color="var(--aviation-sky)" />
                  <span>Peserta Magang</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Rizky Pratama</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@otban1.id', 'AdminOtban2026!')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', padding: '8px', gap: '2px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  <ShieldCheck size={14} color="var(--aviation-sky)" />
                  <span>Admin Pembina</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Administrator</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{
          background: '#f8fafc',
          padding: '14px 20px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-light)',
        }}>
          Kementerian Perhubungan RI &bull; Ditjen Perhubungan Udara
        </div>
      </div>
    </div>
  );
}
