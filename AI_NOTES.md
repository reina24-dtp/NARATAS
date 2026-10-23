# AI_NOTES

## Bagian yang saya kerjakan bersama AI
AI menuliskan kode, tetapi arah dan koreksinya datang dari saya. Hal yang saya minta atau perbaiki selama proses:
- Tampilan: mengikuti mockup dashboard acuan (sidebar dan tabel), menempel ke tepi browser, bukan kartu melayang. Layar pembuka tanpa tulisan "tap to skip". Tanpa emoji, hanya ikon. Navbar atas memakai logo NARATAS yang saya siapkan, dan warna mengikuti palet logo.
- Dashboard dengan persentase dan grafik.
- Saya menemukan urutan NIM salah di aplikasi (20230011 tampil di atas 2023002), lalu meminta perbaikan.
- Saya menemukan backend dan frontend harus dijalankan di terminal terpisah, lalu meminta agar bisa dijalankan bersamaan.
- Saya meminta lingkaran profil di navbar dihapus.
- Saya meminta perpindahan menu dan kartu dibuat halus, serta tampilan responsif di semua perangkat.
- Saya melaporkan saat backend tidak bisa dibuka, lalu menguji ulang langkah menjalankannya dan meminta penjelasan perubahan yang dibuat.
- Dokumen README.md, CLAUDE.md, dan AI_NOTES.md.
[TAMBAHKAN perbaikan lain yang Anda lakukan sendiri tapi belum tercantum di atas]

## Satu contoh saran AI yang saya tolak atau perbaiki, dan alasannya
AI menyarankan framework dan tools yang paling dikuasainya (React untuk frontend, Express untuk backend), padahal ketentuan tugas mengharuskan Laravel.
[ISI SENDIRI: apa yang Anda putuskan terhadap saran ini (ditolak, diganti ke Laravel, atau tetap dipakai dengan alasan tertentu) dan alasannya. Tuliskan sesuai kenyataan, karena kode yang dikumpulkan saat ini memakai React dan Express.]

Contoh lain yang juga nyata: kode awal mengurutkan mahasiswa dengan `ORDER BY nim`. Karena NIM bertipe teks, urutannya salah. Saya yang menemukannya, lalu diganti menjadi `ORDER BY LENGTH(nim), nim`. Kolom NIM sengaja tetap teks supaya NIM berawalan nol tidak rusak.

## Bagian yang saya kerjakan tanpa AI, dan alasannya
- Pembuatan database: perancangan tabel dan relasinya (kelas, mahasiswa, pendaftaran, pertemuan, kehadiran).
- Ide desain dan branding website: nama NARATAS, logo, palet warna, dan tema ITS.
alasan mengapa ini saya kerjakan sendiri dan memilih its sebagai unsur itu karena its adalah kampus impian saya

## Kalau mengulang dari awal, apa yang akan saya ubah
- Memastikan teknologi sesuai ketentuan tugas (Laravel) sejak awal, dan menuliskannya di CLAUDE.md supaya AI tidak memilih tools sendiri.
- Menguji backend dengan database sungguhan sejak awal, bukan baru menyadari masalah urutan NIM dan cara menjalankan setelah aplikasi jadi.
- Menyediakan satu perintah untuk menjalankan semuanya sejak awal.
- Commit lebih kecil dan lebih sering, satu commit per bagian yang selesai.
