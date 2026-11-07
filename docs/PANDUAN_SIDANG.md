# Panduan demonstrasi sidang magang

## Tujuan sistem
Memusatkan pencatatan kehadiran dan bukti kegiatan peserta magang, mengurangi rekap manual, dan memberikan pembina ruang untuk memverifikasi izin serta mengevaluasi kegiatan harian.

## Pembagian akses
| Area | Peserta | Admin / Pembina |
|---|---|---|
| Presensi dan riwayat | Catat dan lihat milik sendiri | Monitoring seluruh peserta |
| Izin/sakit | Ajukan, lihat keputusan, batalkan yang pending | Tinjau lampiran dan beri keputusan |
| Logbook | Kirim, perbaiki revisi, lihat ulasan | Tinjau dan setujui/revisi |
| Pengumuman | Baca | Terbitkan/hapus |
| Peserta, pengaturan, rekap | Tidak tersedia | Kelola |
| Profil dan password | Milik sendiri | Milik sendiri; reset password peserta |

## Alur demonstrasi 10–15 menit
1. Login admin. Jelaskan bahwa role ditentukan server berdasarkan akun, bukan selector login.
2. Tunjukkan ringkasan, tren tujuh hari, dan tindak lanjut. Tambah peserta melalui Peserta Magang, isi divisi dan periode empat bulan.
3. Atur titik kantor dan jam kerja. Untuk uji di rumah, nonaktifkan radius secara eksplisit, kemudian aktifkan kembali setelah demo. Jangan mengubah konfigurasi operasional hanya untuk pengujian.
4. Keluar dan masuk sebagai peserta. Tunjukkan bahwa menu administrasi tidak tersedia.
5. Periksa lokasi secara sadar melalui tombol. Jelaskan perbedaan jarak ke kantor dan akurasi perangkat.
6. Catat masuk; ulangi untuk menunjukkan pencegahan presensi ganda. Isi logbook dengan kegiatan, pembelajaran, dan kendala.
7. Login admin; minta revisi logbook dengan catatan. Login peserta; perbaiki dan kirim ulang. Admin menyetujui. Perlihatkan logbook yang disetujui tidak bisa diubah.
8. Peserta mengajukan izin pada tanggal lain, unggah bukti. Admin memberi keputusan. Tunjukkan catatan keputusan dan hak akses lampiran.
9. Peserta pulang dengan ringkasan pekerjaan. Admin meninjau rekap rentang tanggal dan mengekspor CSV untuk Excel atau mencetak.
10. Terbitkan pengumuman dan tunjukkan tampilannya pada akun peserta.

## Materi teknis yang dapat dijelaskan
- React sebagai antarmuka, Express REST API, SQLite sebagai persistensi, bcrypt untuk hash password, JWT untuk sesi.
- Pemisahan hak akses pada navigasi dan middleware server. ID user dari token yang diverifikasi, bukan dari input peserta.
- Haversine untuk jarak koordinat dan perbandingan radius yang dihitung ulang di server.
- Unique constraint `(user_id,date)` mencegah presensi/logbook ganda.
- Validasi tanggal dan benturan data sebelum penulisan.
- Foreign key dan indeks, migrasi tambahan yang tidak mereset database.
- Pengujian API pada database in-memory serta pengujian browser desktop/mobile.

## Skenario penerimaan
- Password salah gagal; akun nonaktif gagal walaupun sudah punya token.
- Peserta tidak dapat mengakses endpoint admin atau data peserta lain.
- Koordinat salah/di luar radius gagal; presensi masuk kedua pada hari sama gagal.
- Pulang tanpa masuk atau tanpa ringkasan kegiatan yang cukup gagal.
- Izin tumpang tindih atau berbenturan dengan kehadiran ditolak.
- Logbook dapat direvisi dan dikirim ulang, lalu terkunci setelah disetujui.
- Rekap izin beberapa hari menghitung hari kerja, bukan jumlah pengajuan.
- Seluruh menu dapat diakses pada layar ponsel tanpa halaman melebar.

## Batasan dan pengembangan berikutnya
Kalender hari libur, shift per divisi, penugasan pembina khusus per peserta, integrasi SSO, absensi perangkat tepercaya, dan deployment banyak server merupakan ruang pengembangan. Jangan mengklaim GPS browser dapat membuktikan identitas atau sepenuhnya mencegah lokasi palsu. Evaluasi implementasi empat bulan dapat memakai jumlah logbook disetujui, tren kehadiran, frekuensi terlambat, dan hasil ulasan pembina tanpa mengubahnya menjadi nilai akademik otomatis.
