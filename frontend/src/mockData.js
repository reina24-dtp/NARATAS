// Data contoh sementara. Hapus file ini setelah backend PostgreSQL siap
// (isi tabel yang sama lewat seeder di backend).
const day = (o) => {
  const d = new Date()
  d.setDate(d.getDate() + o)
  return d.toISOString().slice(0, 10)
}
const NAMES = ['Aditya Pratama', 'Bunga Lestari', 'Citra Maharani', 'Dimas Saputra', 'Eka Wulandari', 'Fajar Nugroho',
  'Gita Permata', 'Hendra Wijaya', 'Intan Kusuma', 'Joko Santoso', 'Kirana Putri', 'Laras Ayu']
const pick = (i, m) => ((i * m) % 11 === 0 ? 'alpa' : (i + m) % 9 === 0 ? 'sakit' : (i * m) % 7 === 0 ? 'izin' : 'hadir')

export function seed() {
  const db = {
    seq: 100,
    classes: [
      { id: 1, course: 'Pemrograman Web', name: 'TI-3A', lecturer: 'Dr. Budi Hartono' },
      { id: 2, course: 'Basis Data', name: 'TI-3B', lecturer: 'Sari Dewi, M.Kom.' },
    ],
    students: NAMES.map((name, i) => ({ id: i + 1, nim: String(2024001 + i), name })),
    enrollments: [], meetings: [], attendances: [],
  }
  for (let i = 1; i <= 10; i++) db.enrollments.push({ classId: 1, studentId: i })
  for (let i = 5; i <= 12; i++) db.enrollments.push({ classId: 2, studentId: i })
  ;[-28, -21, -14, -7, 2].forEach((o, k) => db.meetings.push({ id: k + 1, classId: 1, no: k + 1, date: day(o) }))
  db.meetings.push({ id: 6, classId: 2, no: 1, date: day(-10) }, { id: 7, classId: 2, no: 2, date: day(4) })
  for (let m = 1; m <= 4; m++) for (let i = 1; i <= 10; i++) db.attendances.push({ meetingId: m, studentId: i, status: pick(i, m) })
  for (let i = 5; i <= 12; i++) db.attendances.push({ meetingId: 6, studentId: i, status: pick(i, 6) })
  return db
}
