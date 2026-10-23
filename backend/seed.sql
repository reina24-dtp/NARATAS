INSERT INTO classes (course_name, class_name, lecturer) VALUES
  ('Pemrograman Web', 'TI-3A', 'Dr. Ratna Dewi'),
  ('Basis Data', 'TI-3B', 'Ir. Hendra Wijaya');

INSERT INTO students (nim, name) VALUES
  ('2023001', 'Syifa Reina Nurcandrani'),
  ('2023002', 'Reyna Cindy Oktafia'),
  ('2023003', 'Almira Khairani Aqilah'),
  ('2023004', 'Evelyn Nafil Rasendriya'),
  ('2023005', 'Kirani Alika Putri'),
  ('2023006', 'Andi Pratama'),
  ('2023007', 'Budi Santoso'),
  ('2023008', 'Dimas Aditya Pratama'),
  ('2023009', 'Fajar Ramadhan'),
  ('2023010', 'Galih Permana');

-- Kelas 1 (Pemrograman Web): mahasiswa 1-6
-- Kelas 2 (Basis Data): mahasiswa 5-10
INSERT INTO enrollments (class_id, student_id) VALUES
  (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),
  (2,5),(2,6),(2,7),(2,8),(2,9),(2,10);

INSERT INTO meetings (class_id, meeting_number, meeting_date) VALUES
  (1, 1, '2026-09-07'),
  (1, 2, '2026-09-14'),
  (2, 1, '2026-09-08');

-- Kehadiran pertemuan 1 dan 2 kelas Pemrograman Web
-- Pertemuan 1 kelas Basis Data sengaja dikosongkan untuk uji kasus "belum diisi"
INSERT INTO attendances (meeting_id, student_id, status) VALUES
  (1,1,'hadir'),(1,2,'hadir'),(1,3,'izin'),(1,4,'alpa'),(1,5,'hadir'),(1,6,'hadir'),
  (2,1,'hadir'),(2,2,'sakit'),(2,3,'hadir'),(2,4,'hadir'),(2,5,'alpa'),(2,6,'hadir');