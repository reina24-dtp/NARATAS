# NARATAS, Class Management System (React + Vite)

## Menjalankan
    npm install
    npm run dev      # buka alamat yang tampil (biasanya http://localhost:5173)
    npm run build    # hasil di folder dist

## Struktur
- `src/api.js`: satu-satunya tempat yang bicara dengan data. Sekarang memakai `mockData.js`
  (disimpan di localStorage). Komentar di atas tiap fungsi menunjukkan endpoint yang disarankan.
- `src/mockData.js`: data contoh sementara, hapus setelah backend siap.
- `src/config.js`: nama aplikasi, semester, lama layar pembuka.
- `public/`: logo NARATAS (`naratas-logo.png`, `naratas-mark.png`) dan favicon.
- `src/components/ui.jsx`: komponen `Logo`, layar pembuka, modal, toast, dan komponen bersama.
- `src/components/charts.jsx`: grafik SVG (donut, gauge, area) tanpa library.
- `src/pages/`: Dashboard, Kelas (+ detail anggota), Mahasiswa, Pertemuan, Kehadiran, Rekap.

## Integrasi backend
Ganti isi fungsi di `api.js` dengan `fetch('/api/...')` (proxy `/api` sudah diatur di `vite.config.js`).
Bentuk data yang dikembalikan jangan diubah supaya halaman tidak perlu disentuh.
`GET /api/dashboard` kini juga mengembalikan `perClass` (rata-rata per kelas) dan `trend` (persen hadir tiap pertemuan yang sudah diisi) untuk grafik.

## Aturan bisnis
Persentase kehadiran = Hadir / jumlah pertemuan yang sudah diisi x 100. Izin dan sakit tidak dihitung hadir.
