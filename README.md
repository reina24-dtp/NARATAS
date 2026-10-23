# NARATAS (Class Management System)

Aplikasi web untuk mengelola kelas, mahasiswa, pertemuan, dan kehadiran (absensi) beserta rekap persentasenya.
Frontend memakai React + Vite, backend memakai Express, database PostgreSQL.

## Kebutuhan
- Node.js 18.11 atau lebih baru (cek dengan `node -v`)
- PostgreSQL yang sudah berjalan (di Windows biasanya otomatis aktif sebagai layanan)

## Instalasi
1. Salin `backend/.env.example` menjadi `backend/.env`, lalu isi `DB_USER` dan `DB_PASSWORD` sesuai PostgreSQL di komputer Anda.
2. Di folder utama proyek (yang berisi file ini), jalankan:
   ```
   npm run install:all
   npm run db:setup
   ```
   `db:setup` membuat database, tabel, dan data contoh. Perintah ini MENGHAPUS tabel lama, jadi jangan dijalankan ulang jika data ingin dipertahankan.

## Menjalankan
- Mode pengembangan (backend dan frontend sekaligus dalam satu terminal):
  ```
  npm run dev
  ```
  Buka http://localhost:5173
- Mode satu alamat (frontend di-build lalu disajikan backend):
  ```
  npm start
  ```
  Buka http://localhost:3001

## Mengakses aplikasi
Menu di sisi kiri: Dashboard, Kelas, Mahasiswa, Pertemuan, Kehadiran, Rekap. Tidak ada login; aplikasi dianggap dipakai oleh satu dosen atau admin.

## Asumsi yang dibuat
- Tidak ada sistem login atau peran pengguna.
- NIM disimpan sebagai teks dan harus unik. Karena panjang NIM bisa berbeda, urutan tampil memakai panjang NIM lebih dulu, lalu isinya.
- Nomor pertemuan dibuat otomatis (nomor terakhir di kelas ditambah satu).
- Persentase kehadiran = jumlah Hadir dibagi jumlah pertemuan yang sudah diisi absennya, dikali 100. Izin dan Sakit tidak dihitung hadir. Jika belum ada pertemuan yang diisi, persentase kosong.
- Menghapus mahasiswa menghapus pendaftarannya di semua kelas beserta data absennya. Mengeluarkan mahasiswa dari satu kelas hanya menghapus absennya di kelas itu.
- Nama semester ditulis di `frontend/src/config.js`, bukan diambil dari database.

## Struktur
- `backend/`: API Express (`routes/`), koneksi database (`db.js`), `schema.sql`, `seed.sql`, `setup-db.js`
- `frontend/src/`: halaman di `pages/`, komponen bersama di `components/`, seluruh pemanggilan API di `api.js`