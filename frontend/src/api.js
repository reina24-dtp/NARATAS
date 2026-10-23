// SATU-SATUNYA tempat yang bicara dengan data.
// Sekarang memakai mockData (disimpan di localStorage). Saat backend siap, ganti isi tiap fungsi
// dengan fetch ke endpoint-nya, contoh:
//   classes: () => http('GET', '/api/classes')
// Bentuk data yang dikembalikan jangan diubah supaya halaman tidak perlu disentuh.
import { seed } from './mockData'

const KEY = 'absensi-react-v1'
let db = null
try { db = JSON.parse(localStorage.getItem(KEY)) } catch { /* abaikan */ }
if (!db || !db.classes) db = seed()
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* abaikan */ } }
const out = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 60)) // meniru jeda jaringan
const uid = () => ++db.seq
const need = (v, msg) => { if (!String(v ?? '').trim()) throw new Error(msg) }
const byName = (a, b) => a.name.localeCompare(b.name)
const cls = (id) => db.classes.find((c) => c.id == id)
const stu = (id) => db.students.find((s) => s.id == id)
const enrolledOf = (cid) => db.enrollments.filter((x) => x.classId == cid).map((x) => stu(x.studentId)).filter(Boolean).sort(byName)
const meetingsOf = (cid) => db.meetings.filter((m) => m.classId == cid).sort((a, b) => a.no - b.no)
const attOf = (mid) => db.attendances.filter((a) => a.meetingId == mid)
const r1 = (n) => Math.round(n * 10) / 10
const mean = (a) => (a.length ? r1(a.reduce((x, y) => x + y, 0) / a.length) : null)
const withCounts = (c) => ({ ...c, studentCount: enrolledOf(c.id).length, meetingCount: meetingsOf(c.id).length })

// Aturan: persen = hadir / jumlah pertemuan yang sudah diisi x 100. Izin dan sakit TIDAK dihitung hadir.
function rekapOf(cid) {
  const ms = meetingsOf(cid).filter((m) => attOf(m.id).length)
  const ids = new Set(ms.map((m) => m.id))
  const rows = enrolledOf(cid).map((s) => {
    const c = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
    db.attendances.forEach((a) => { if (a.studentId == s.id && ids.has(a.meetingId)) c[a.status]++ })
    return { ...s, ...c, pct: ms.length ? r1((c.hadir / ms.length) * 100) : null }
  })
  return { total: ms.length, rows }
}

export const api = {
  // GET /api/classes
  async classes() { return out(db.classes.map(withCounts)) },
  // GET /api/classes/:id  (+ mahasiswa terdaftar)
  async classDetail(id) {
    if (!cls(id)) throw new Error('Kelas tidak ditemukan')
    return out({ class: withCounts(cls(id)), students: enrolledOf(id) })
  },
  // POST /api/classes, PUT /api/classes/:id
  async saveClass(v, id) {
    need(v.course, 'Nama mata kuliah wajib diisi.'); need(v.name, 'Nama kelas wajib diisi.'); need(v.lecturer, 'Nama dosen wajib diisi.')
    const o = { course: v.course.trim(), name: v.name.trim(), lecturer: v.lecturer.trim() }
    if (id) Object.assign(cls(id), o); else db.classes.push({ id: uid(), ...o })
    persist(); return out(null)
  },
  // DELETE /api/classes/:id
  async deleteClass(id) {
    const mids = meetingsOf(id).map((m) => m.id)
    db.attendances = db.attendances.filter((a) => !mids.includes(a.meetingId))
    db.meetings = db.meetings.filter((m) => m.classId != id)
    db.enrollments = db.enrollments.filter((x) => x.classId != id)
    db.classes = db.classes.filter((c) => c.id != id)
    persist(); return out(null)
  },

  // GET /api/students
  async students() { return out([...db.students].sort((a, b) => a.nim.localeCompare(b.nim))) },
  // POST /api/students, PUT /api/students/:id  (NIM harus unik)
  async saveStudent(v, id) {
    need(v.nim, 'NIM wajib diisi.'); need(v.name, 'Nama wajib diisi.')
    const nim = v.nim.trim()
    if (db.students.some((s) => s.nim == nim && s.id != id)) throw new Error(`NIM ${nim} sudah dipakai mahasiswa lain.`)
    if (id) Object.assign(stu(id), { nim, name: v.name.trim() }); else db.students.push({ id: uid(), nim, name: v.name.trim() })
    persist(); return out(null)
  },
  // DELETE /api/students/:id
  async deleteStudent(id) {
    db.attendances = db.attendances.filter((a) => a.studentId != id)
    db.enrollments = db.enrollments.filter((x) => x.studentId != id)
    db.students = db.students.filter((s) => s.id != id)
    persist(); return out(null)
  },

  // POST /api/classes/:id/enrollments  { studentIds: [] }
  async enroll(cid, ids) {
    ids.forEach((sid) => { if (!db.enrollments.some((x) => x.classId == cid && x.studentId == sid)) db.enrollments.push({ classId: +cid, studentId: +sid }) })
    persist(); return out(null)
  },
  // DELETE /api/classes/:id/enrollments/:studentId  (absensinya di kelas itu ikut terhapus)
  async unenroll(cid, sid) {
    const mids = meetingsOf(cid).map((m) => m.id)
    db.attendances = db.attendances.filter((a) => !(a.studentId == sid && mids.includes(a.meetingId)))
    db.enrollments = db.enrollments.filter((x) => !(x.classId == cid && x.studentId == sid))
    persist(); return out(null)
  },

  // GET /api/classes/:id/meetings
  async meetings(cid) {
    if (!cls(cid)) throw new Error('Kelas tidak ditemukan')
    return out({ class: withCounts(cls(cid)), meetings: meetingsOf(cid).map((m) => ({ ...m, filled: attOf(m.id).length })) })
  },
  // GET /api/meetings  (semua kelas, dikelompokkan)
  async meetingsAll() {
    return out(db.classes.map((c) => ({ ...withCounts(c), meetings: meetingsOf(c.id).map((m) => ({ ...m, filled: attOf(m.id).length })) })))
  },
  // POST /api/classes/:id/meetings  { date }  (nomor pertemuan dibuat otomatis)
  async addMeeting(cid, date) {
    need(date, 'Tanggal wajib diisi.')
    const no = Math.max(0, ...meetingsOf(cid).map((m) => m.no)) + 1
    db.meetings.push({ id: uid(), classId: +cid, no, date }); persist(); return out(null)
  },
  // DELETE /api/meetings/:id
  async deleteMeeting(id) {
    db.attendances = db.attendances.filter((a) => a.meetingId != id)
    db.meetings = db.meetings.filter((m) => m.id != id)
    persist(); return out(null)
  },

  // GET /api/meetings/:id/attendance  -> daftar mahasiswa kelas + status (null jika belum diisi)
  async attendance(mid) {
    const m = db.meetings.find((x) => x.id == mid)
    if (!m) throw new Error('Pertemuan tidak ditemukan')
    const map = Object.fromEntries(attOf(mid).map((a) => [a.studentId, a.status]))
    return out({ meeting: m, class: cls(m.classId), students: enrolledOf(m.classId).map((s) => ({ ...s, status: map[s.id] || null })) })
  },
  // PUT /api/meetings/:id/attendance  { "<studentId>": "hadir|izin|sakit|alpa" }
  // Validasi ini HARUS ada juga di backend (status valid + mahasiswa terdaftar di kelas).
  async saveAttendance(mid, map) {
    const m = db.meetings.find((x) => x.id == mid)
    const ok = new Set(enrolledOf(m.classId).map((s) => s.id))
    Object.entries(map).forEach(([sid, st]) => {
      if (!ok.has(+sid)) throw new Error('Mahasiswa belum terdaftar di kelas ini.')
      if (!STATUS_OK.includes(st)) throw new Error('Status tidak valid: ' + st)
    })
    db.attendances = db.attendances.filter((a) => a.meetingId != mid)
    Object.entries(map).forEach(([sid, st]) => db.attendances.push({ meetingId: +mid, studentId: +sid, status: st }))
    persist(); return out(null)
  },

  // GET /api/classes/:id/rekap
  async rekap(cid) {
    if (!cls(cid)) throw new Error('Kelas tidak ditemukan')
    return out({ class: cls(cid), ...rekapOf(cid) })
  },

  // GET /api/dashboard
  async dashboard() {
    const per = db.classes.map((c) => {
      const r = rekapOf(c.id)
      return { ...withCounts(c), avg: mean(r.rows.filter((s) => s.pct != null).map((s) => s.pct)), rows: r.rows }
    })
    const allPct = per.flatMap((p) => p.rows.filter((s) => s.pct != null).map((s) => s.pct))
    const totals = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
    db.attendances.forEach((a) => { if (totals[a.status] != null) totals[a.status]++ })
    const meetings = db.meetings.map((m) => ({ id: m.id, classId: m.classId, no: m.no, date: m.date, label: `${cls(m.classId).course} ${cls(m.classId).name}`, filled: attOf(m.id).length > 0 }))
    const perStudent = {}
    per.forEach((p) => p.rows.forEach((s) => { if (s.pct != null) (perStudent[s.id] ??= { name: s.name, v: [] }).v.push(s.pct) }))
    const top = Object.entries(perStudent).map(([id, s]) => ({ id: +id, name: s.name, pct: mean(s.v) })).sort((a, b) => b.pct - a.pct).slice(0, 3)
    // Tambahan untuk grafik dashboard: rata-rata per kelas dan tren persen hadir tiap pertemuan yang sudah diisi.
    const perClass = per.map((p) => ({ id: p.id, label: `${p.course} ${p.name}`, avg: p.avg, studentCount: p.studentCount }))
    const trend = db.meetings
      .filter((m) => attOf(m.id).length)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => {
        const a = attOf(m.id)
        return { id: m.id, no: m.no, date: m.date, label: `${cls(m.classId).course} ${cls(m.classId).name}`, pct: r1((a.filter((x) => x.status === 'hadir').length / a.length) * 100) }
      })
    return out({ counts: { classes: db.classes.length, students: db.students.length, meetings: db.meetings.length }, avg: mean(allPct), totals, meetings, top, perClass, trend })
  },
}
const STATUS_OK = ['hadir', 'izin', 'sakit', 'alpa']
