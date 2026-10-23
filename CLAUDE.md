# Project: NARATAS (absensi / Class Management System)

## Deskripsi singkat
Aplikasi pengelolaan kelas: data kelas, mahasiswa, pertemuan, pencatatan kehadiran, dan rekap persentase hadir. Satu pengguna (dosen/admin), tanpa login. Tampilan bertema ITS dengan logo NARATAS.

## Teknologi yang dipakai dan cara menjalankan
- Frontend: React 18, Vite, react-router-dom, lucide-react (ikon), CSS biasa di `frontend/src/styles.css`. Grafik dibuat dengan SVG sendiri (`components/charts.jsx`).
- Backend: Node.js (ES modules), Express 5, pustaka `pg`. Query SQL ditulis langsung, tanpa ORM.
- Database: PostgreSQL. Skema di `backend/schema.sql`, data contoh di `backend/seed.sql`.
- Pertama kali: `npm run install:all` lalu `npm run db:setup`. Sehari-hari: `npm run dev` (frontend 5173, backend 3001). `npm start` untuk satu alamat di 3001.
- Semua pemanggilan API frontend lewat `frontend/src/api.js`; halaman tidak memanggil `fetch` sendiri.

## Aturan bisnis penting
- Status kehadiran hanya: hadir, izin, sakit, alpa (dicek di backend dan di CHECK constraint database).
- Persen hadir = Hadir / jumlah pertemuan yang SUDAH diisi absennya x 100. Izin dan sakit tidak dihitung hadir. Belum ada pertemuan terisi: persen null.
- NIM unik dan bertipe teks. Urutan tampil: `ORDER BY LENGTH(nim), nim` agar urut secara angka.
- Nomor pertemuan otomatis (maks + 1 per kelas), unik per kelas.
- Absen hanya boleh untuk mahasiswa yang terdaftar di kelas pertemuan itu; simpan absen satu pertemuan dalam satu transaksi.
- Mengeluarkan mahasiswa dari kelas menghapus absennya di kelas itu saja.

## Aturan penulisan kode
- Teks antarmuka dan pesan error dalam bahasa Indonesia; nama variabel dan fungsi dalam bahasa Inggris atau mengikuti kode yang sudah ada.
- Query SQL selalu berparameter ($1, $2), tidak pernah menyambung string dari input.
- Backend: validasi input di route, kembalikan `{ error: '...' }` dengan status HTTP yang sesuai.
- Frontend: jangan ubah bentuk data yang dikembalikan `api.js`; warna ikut palet logo (#124BFF, #FFD43B, #E5EAFB, #172554) lewat variabel CSS; tanpa emoji, gunakan ikon.
- Semua tampilan harus responsif dan hormati `prefers-reduced-motion`.

## Hal yang tidak boleh dilakukan AI
- Jangan menjalankan `npm run db:setup`, `schema.sql`, atau perintah DROP/DELETE massal tanpa persetujuan: itu menghapus data.
- Jangan commit atau menampilkan isi `backend/.env` (berisi password); gunakan `.env.example`.
- Jangan mengubah skema database atau aturan hitung persentase tanpa diminta.
- Jangan menambah library baru tanpa alasan yang disebutkan.
- Jangan menyatakan fitur "sudah berjalan" jika belum diuji dengan database sungguhan; sebutkan apa yang belum diuji.
