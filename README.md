# Sistem Informasi Absensi Anak Magang Otban 1
### Kantor Otoritas Bandar Udara Wilayah I (Kelas Utama Soekarno-Hatta)

Sistem Informasi Absensi Anak Magang Otban 1 adalah aplikasi web modern, responsif, dan komprehensif yang dirancang untuk mengelola dan memantau kehadiran peserta magang (mahasiswa/pelajar) di lingkungan **Kantor Otoritas Bandar Udara Wilayah I, Ditjen Perhubungan Udara, Kementerian Perhubungan RI**.

Aplikasi ini dilengkapi dengan fitur **Geofencing Radius GPS (Haversine Formula)**, pencatatan waktu realtime WIB, validasi keterlambatan, pengajuan izin/sakit dengan bukti berkas, manajemen peserta magang, hingga rekapitulasi data dan ekspor laporan ke format Microsoft Excel / CSV.

---

## ✈ Fitur Utama

### 1. Peserta Magang (Intern)
- **Login Akun Mandiri**: Keamanan password terenkripsi bcrypt dan token JWT.
- **Dashboard & Jam Realtime WIB**: Widget jam digital aktif dengan tanggal lengkap.
- **Deteksi Geofencing & Radius Kantor**:
  - Browser secara otomatis membaca koordinat GPS perangkat.
  - Menghitung jarak presisi ke titik pusat Kantor Otban 1 menggunakan rumus *Haversine*.
  - Menampilkan indikator jarak (*misal: 45 meter dari kantor*).
  - Membatasi tombol absen jika peserta berada di luar radius kantor yang telah ditetapkan.
- **Absen Masuk**: Otomatis mendeteksi status **Tepat Waktu** (sebelum pukul 08:00 WIB) atau **Terlambat**.
- **Absen Pulang & Laporan Harian**: Peserta mencatat waktu pulang serta mengisi ringkasan kegiatan/tugas kedinasan yang diselesaikan hari itu.
- **Pengajuan Izin & Sakit**: Formulir pengajuan izin sakit/keperluan kampus dengan upload berkas bukti surat dokter/kampus (JPG, PNG, PDF).
- **Riwayat Kehadiran Pribadi**: Log presensi lengkap dengan filter bulan & tahun, status keterlambatan, dan jarak GPS saat presensi.

### 2. Administrator & Pembina Magang
- **Dashboard Analitik**: Kartu ringkasan jumlah magang aktif, hadir hari ini, terlambat, izin/sakit, dan belum absen, disertai feed aktivitas terkini.
- **Manajemen Peserta Magang**: Tambah peserta baru, edit profil, divisi penempatan Otban 1, nonaktifkan akun, reset kata sandi, dan hapus data.
- **Monitoring Presensi Seluruh Peserta**: Pemantauan langsung seluruh log kedatangan, jam pulang, jarak meter, dan filter berdasarkan tanggal atau divisi.
- **Verifikasi Permohonan Izin**: Tinjau berkas lampiran surat peserta, setujui (*Approve*) atau tolak (*Reject*) dengan catatan pembina.
- **Pengaturan Titik Kantor & Radius Geofencing**:
  - Atur Latitude dan Longitude kantor Otban 1.
  - Tombol pintar *"Ambil Lokasi Saya"* untuk mendeteksi koordinat admin saat itu juga.
  - Atur batas radius toleransi (mulai dari 50 meter hingga 5 kilometer).
  - Tombol **Toggle Switch (Wajibkan Radius: Aktif / Nonaktif)** untuk kemudahan mode pengujian/evaluasi.
  - Atur jam kerja kantor (batas jam masuk dan jam minimal pulang).
- **Rekapitulasi & Ekspor Laporan**:
  - Rekap akumulasi hari hadir, tepat waktu, terlambat, sakit, dan izin per peserta dalam rentang tanggal tertentu.
  - Tombol Cetak (*Print Friendly*) dan tombol **Ekspor ke Excel / CSV**.

---

## 🛠 Teknologi yang Digunakan

- **Backend**: Node.js v24 + Express.js REST API
- **Database**: SQLite bawaan Node.js (`node:sqlite DatabaseSync`) — *Zero configuration, data tersimpan aman di file lokal `backend/data/otban_absensi.db` tanpa perlu instal server MySQL/Postgres terpisah.*
- **Frontend**: Vite + React 18
- **Styling**: **Vanilla CSS Modern Design System** (Aviation Navy, Sky Blue, Glassmorphism, Micro-animations, Fully Responsive Laptop/Tablet/HP).
- **Ikon**: Lucide React Icons

---

## 🔑 Akun Default untuk Pengujian Cepat

Sistem sudah dilengkapi dengan database seeder data awal dan tombol **1-Klik Demo Login** di halaman login:

| Peran (Role) | Alamat Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin Pembina** | `admin@otban1.id` | `AdminOtban2026!` | Hak akses penuh administrator |
| **Peserta Magang 1** | `magang@otban1.id` | `MagangOtban2026!` | Rizky Pratama (Divisi Kelaikudaraan) |
| **Peserta Magang 2** | `sarah.azhari@otban1.id` | `MagangOtban2026!` | Sarah Azhari (Divisi Pelayanan Bandara) |
| **Peserta Magang 3** | `dimas.setiawan@otban1.id` | `MagangOtban2026!` | Dimas Bagus (Tata Usaha) |
| **Peserta Magang 4** | `anisa.rahma@otban1.id` | `MagangOtban2026!` | Anisa Rahmawati (Keamanan Penerbangan) |

---

## 🚀 Cara Menjalankan Aplikasi

Pastikan Node.js (v20+ atau v24) telah terpasang di komputer Anda.

### 1. Menjalankan Server (Frontend & Backend Bersamaan)
Cukup buka terminal di folder proyek ini dan jalankan perintah:

```bash
npm run dev
```

Perintah di atas akan secara otomatis menyalakan:
- **Backend API**: `http://localhost:5000`
- **Frontend Web**: `http://localhost:5173`

### 2. Buka di Browser
Buka Google Chrome, Microsoft Edge, atau browser favorit Anda dan akses:
👉 **`http://localhost:5173`**

---

## 📍 Panduan Pengujian Fitur Radius Lokasi (Geofencing)

1. Masuk sebagai **Peserta Magang** (`magang@otban1.id` / `MagangOtban2026!`).
2. Browser akan meminta izin akses lokasi (*Allow Location*). Klik **Allow / Izinkan**.
3. Di banner atas, Anda akan melihat status lokasi dan jarak Anda terhadap kantor Otban 1:
   - Jika Anda sedang tidak berada di kantor Otban 1 (misalnya sedang di rumah atau kampus), sistem akan menandai **"Di Luar Radius Kantor"** dan tombol absen akan terkunci demi keamanan integritas kehadiran.
4. **Ingin mencoba tombol Absen saat sedang di rumah?**
   - Sangat mudah! Keluar akun dan login sebagai **Admin** (`admin@otban1.id`).
   - Masuk ke menu **"Pengaturan Lokasi & Radius"**.
   - Klik tombol **"STATUS: NONAKTIF"** pada switch validasi radius, atau klik **"Ambil Lokasi Saya"** untuk mengubah titik koordinat kantor ke lokasi tempat Anda berada saat ini.
   - Klik **Simpan Seluruh Pengaturan**.
   - Kembali ke akun Magang, tombol Absen Masuk dan Pulang kini langsung terbuka dan dapat Anda uji coba dengan lancar!

---

## 📂 Struktur Direktori Proyek

```
absensi anak magang kantor otoritas bandara wilayah 1/
├── backend/
│   ├── data/                 # File database SQLite (otban_absensi.db)
│   ├── uploads/              # Berkas bukti surat dokter/izin yang diunggah
│   ├── src/
│   │   ├── config/           # Konfigurasi database SQLite (db.js)
│   │   ├── controllers/      # Auth, Attendance, Leave, Admin controllers
│   │   ├── middleware/       # JWT authMiddleware & Multer uploadMiddleware
│   │   ├── routes/           # Router express (auth, attendance, leaves, admin)
│   │   └── utils/            # Perhitungan Haversine (geo.js), time.js, seeder.js
│   ├── server.js             # Server utama Express
│   └── package.json
├── frontend/
│   ├── index.html            # Template HTML dengan SEO & Google Fonts
│   ├── vite.config.js        # Konfigurasi bundler Vite & API Proxy
│   ├── src/
│   │   ├── components/       # Sidebar, Navbar, Toast, StatCard
│   │   ├── context/          # AuthContext session provider
│   │   ├── pages/
│   │   │   ├── Login.jsx     # Halaman login dengan quick selector
│   │   │   ├── intern/       # Dashboard, Pengajuan Izin, Riwayat
│   │   │   └── admin/        # Dashboard Admin, Kelola Magang, Monitoring, Radius, Laporan
│   │   ├── services/         # API fetch client
│   │   ├── styles/           # Vanilla CSS Design System bertema Aviation
│   │   ├── App.jsx           # Routing & layout utama
│   │   └── main.jsx          # Entrypoint React
│   └── package.json
├── package.json              # Script runner root (concurrently)
└── README.md                 # Dokumentasi sistem
```

---

## ⚖ Lisensi & Hak Cipta
Dikembangkan untuk kebutuhan kedinasan dan operasional Kantor Otoritas Bandar Udara Wilayah I (Kelas Utama Soekarno-Hatta), Direktorat Jenderal Perhubungan Udara, Kementerian Perhubungan Republik Indonesia.
