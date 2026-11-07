# Portal Absensi & Kegiatan Magang — Otban Wilayah I

Aplikasi React + Express untuk peserta magang dan administrator/pembina. SQLite disimpan lokal di `backend/data/otban_absensi.db`. Gunakan **Node.js 24 atau lebih baru** karena backend memakai `node:sqlite`.

## Menjalankan

Dari folder proyek:

```sh
npm install
npm run setup
npm run seed
npm run dev
```

Buka http://localhost:5173. Backend berada di http://localhost:5000. Seeder hanya untuk demonstrasi: membuat akun dan data contoh apabila belum ada, tanpa mereset kata sandi akun lama.

| Peran | Email demo | Kata sandi demo |
|---|---|---|
| Admin / Pembina | admin@otban1.id | AdminOtban2026! |
| Peserta | magang@otban1.id | MagangOtban2026! |

Pilihan peran pada login membantu menjelaskan penggunaan. **Hak akses tetap berasal dari database**, bukan pilihan tombol, localStorage, atau parameter pengguna. Akun admin diarahkan ke Ringkasan; akun peserta ke Dashboard. Tidak ada registrasi mandiri; admin menambahkan akun peserta dan mengatur penempatan serta periode magang.

## Fitur

- Dua panel dengan navigasi terpisah dan pemeriksaan peran pada API.
- Dashboard admin: ringkasan presensi, grafik 7 hari, prioritas tindak lanjut, aktivitas terbaru.
- Dashboard peserta: jam WIB, GPS atas permintaan, status masuk/pulang, progres periode magang, pengumuman.
- Presensi masuk/pulang: validasi radius di server, pencegahan duplikasi, ringkasan kegiatan wajib saat pulang.
- Riwayat pribadi, manajemen peserta, filter monitoring, persetujuan izin/sakit dengan catatan.
- Pengajuan izin tervalidasi: tanggal benar, rentang berurutan, tidak tumpang tindih, tidak berbenturan dengan presensi.
- Lampiran JPG/PNG/WEBP/PDF maksimal 5 MB; unduhan hanya untuk pemilik atau admin.
- Logbook: kegiatan, pembelajaran, kendala; alur kirim → ulasan → revisi → kirim ulang → disetujui. Logbook disetujui terkunci. Hanya tanggal dengan presensi masuk yang boleh diisi.
- Pengumuman normal/penting oleh admin, dibaca seluruh pengguna.
- Profil dan ganti kata sandi; penempatan/email/peran dikelola admin.
- Rekap presensi dan hari izin/sakit, ekspor CSV kompatibel Excel, cetak, ekspor logbook.
- Layout desktop dan ponsel, navigasi keyboard, fokus terlihat, status loading/error/kosong.

## Database dan query

Tidak perlu memasang MySQL atau PostgreSQL. Struktur dibuat otomatis saat backend mulai dan migrasi bersifat tambahan; data lama tidak dihapus.

Query lengkap tersedia di:

1. `backend/migrations/001_core.sql` — struktur inti untuk database kosong.
2. `backend/migrations/002_workspace.sql` — tabel logbook, pengumuman, dan indeks.

Untuk database lama aplikasi cukup dijalankan; `002_workspace.sql` diterapkan otomatis dengan `CREATE TABLE IF NOT EXISTS`. Untuk menjalankannya sendiri melalui DBeaver, pilih koneksi **SQLite** ke file database, lalu jalankan kedua skrip berurutan. Password akun harus dibuat lewat aplikasi/seeder agar tersimpan sebagai bcrypt, jangan memasukkan password polos melalui SQL.

## Pengujian

```sh
npm test
npm run build
npx playwright install chromium
npm run test:ui
```

Tes API memakai database dalam memori. Tes browser memakai server port 5088 dan data demonstrasi terisolasi; tidak menyentuh database operasional. Screenshot pengujian berada di `qa-artifacts/`.

## Build dan pemasangan

```sh
npm run build
npm start
```

Backend sekaligus melayani hasil build frontend pada http://localhost:5000. Untuk deployment, salin `backend/.env.example` menjadi `backend/.env`, isi `JWT_SECRET` acak minimal 32 karakter dan `NODE_ENV=production`. Isi `FRONTEND_ORIGIN` dengan origin frontend. Backend membaca `backend/.env` baik dijalankan dari root maupun direktori backend. Environment juga dapat disediakan host. Tanpa JWT_SECRET pada mode development, secret bersifat sementara dan sesi berakhir saat server dimulai ulang.

## Batas operasional

- GPS browser adalah kontrol lokasi dasar, bukan jaminan anti-pemalsuan. Akurasi bergantung perangkat; HTTPS diperlukan di luar localhost.
- Lokasi peserta berlaku 2 menit di UI; server menghitung ulang jarak dari koordinat yang dikirim. Admin dapat menonaktifkan radius secara eksplisit untuk demo.
- Waktu presensi memakai jam server Asia/Jakarta. Sinkronkan jam host saat dipasang.
- Hari izin/sakit pada rekap dihitung Senin–Jumat; kalender libur nasional dan jadwal shift belum diterapkan. Presensi tetap dapat dicatat pada akhir pekan untuk kegiatan tambahan.
- Ekspor adalah **CSV**, dapat dibuka di Excel; bukan file XLSX.
- Logbook dibatasi 500 catatan per filter; gunakan filter bulan. Pengumuman menampilkan 100 publikasi terbaru.
- SQLite sesuai untuk demonstrasi/operasional skala kecil pada satu server. Cadangkan database (termasuk WAL jika aktif) dan folder uploads. Untuk banyak server, migrasikan melalui desain terpisah.
- Akun demo hanya untuk lingkungan uji. Ubah kata sandi dan data identitas sebelum operasional; jangan gunakan data contoh sebagai data riil.

Lihat `docs/PANDUAN_SIDANG.md` untuk alur demonstrasi dan pembahasan implementasi.
