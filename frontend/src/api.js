// SATU-SATUNYA tempat yang bicara dengan data. Terhubung ke backend Express + PostgreSQL.
// Bentuk data yang dikembalikan sama seperti versi mock, jadi halaman tidak perlu diubah.
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function http(method, path, body) {
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'Terjadi kesalahan pada server.')
  return data
}

const r1 = (n) => Math.round(n * 10) / 10
const mean = (a) => (a.length ? r1(a.reduce((x, y) => x + y, 0) / a.length) : null)

// Backend memakai snake_case; frontend memakai nama field yang dipakai halaman.
const toClass = (c) => ({
  id: c.id, course: c.course_name, name: c.class_name, lecturer: c.lecturer,
  studentCount: c.student_count, meetingCount: c.meeting_count,
})
const toMeeting = (m) => ({
  id: m.id, classId: m.class_id, no: m.meeting_number, date: m.meeting_date,
  filled: m.jumlah_tercatat, hadir: m.hadir,
})
const meetingsOf = async (cid) => (await http('GET', `/api/classes/${cid}/meetings`)).map(toMeeting)

export const api = {
  // ---------- Kelas ----------
  async classes() { return (await http('GET', '/api/classes')).map(toClass) },
  async classDetail(id) {
    const [c, students] = await Promise.all([
      http('GET', `/api/classes/${id}`),
      http('GET', `/api/classes/${id}/students`),
    ])
    return { class: toClass(c), students }
  },
  async saveClass(v, id) {
    const body = { course_name: v.course, class_name: v.name, lecturer: v.lecturer }
    await (id ? http('PUT', `/api/classes/${id}`, body) : http('POST', '/api/classes', body))
    return null
  },
  async deleteClass(id) { await http('DELETE', `/api/classes/${id}`); return null },

  // ---------- Mahasiswa ----------
  async students() { return http('GET', '/api/students') },
  async saveStudent(v, id) {
    const body = { nim: v.nim, name: v.name }
    await (id ? http('PUT', `/api/students/${id}`, body) : http('POST', '/api/students', body))
    return null
  },
  async deleteStudent(id) { await http('DELETE', `/api/students/${id}`); return null },

  // ---------- Pendaftaran mahasiswa ke kelas ----------
  async enroll(cid, ids) {
    await http('POST', `/api/classes/${cid}/students`, { student_ids: ids.map(Number) })
    return null
  },
  async unenroll(cid, sid) { await http('DELETE', `/api/classes/${cid}/students/${sid}`); return null },

  // ---------- Pertemuan ----------
  async meetings(cid) {
    const [c, ms] = await Promise.all([http('GET', `/api/classes/${cid}`), meetingsOf(cid)])
    return { class: toClass(c), meetings: ms }
  },
  async meetingsAll() {
    const classes = await api.classes()
    return Promise.all(classes.map(async (c) => ({ ...c, meetings: await meetingsOf(c.id) })))
  },
  async addMeeting(cid, date) {
    await http('POST', `/api/classes/${cid}/meetings`, { meeting_date: date })
    return null
  },
  async deleteMeeting(id) { await http('DELETE', `/api/meetings/${id}`); return null },

  // ---------- Kehadiran ----------
  async attendance(mid) {
    const d = await http('GET', `/api/meetings/${mid}`)
    return {
      meeting: { id: d.id, classId: d.class_id, no: d.meeting_number, date: d.meeting_date },
      class: { id: d.class_id, course: d.course_name, name: d.class_name, lecturer: d.lecturer },
      students: d.students,
    }
  },
  // map: { "<studentId>": "hadir|izin|sakit|alpa" }. Validasi sebenarnya ada di backend.
  async saveAttendance(mid, map) {
    const records = Object.entries(map).map(([sid, status]) => ({ student_id: Number(sid), status }))
    await http('PUT', `/api/meetings/${mid}/attendance`, { records })
    return null
  },

  // ---------- Rekap ----------
  async rekap(cid) {
    const [c, r] = await Promise.all([
      http('GET', `/api/classes/${cid}`),
      http('GET', `/api/classes/${cid}/recap`),
    ])
    return { class: toClass(c), total: r.total, rows: r.rows }
  },

  // ---------- Dashboard (dihitung dari data kelas, rekap, dan pertemuan) ----------
  async dashboard() {
    const [classes, students] = await Promise.all([api.classes(), api.students()])
    const details = await Promise.all(classes.map(async (c) => {
      const [rk, ms] = await Promise.all([http('GET', `/api/classes/${c.id}/recap`), meetingsOf(c.id)])
      return { c, rows: rk.rows, meetings: ms }
    }))

    const per = details.map(({ c, rows }) => ({
      ...c, rows, avg: mean(rows.filter((s) => s.pct != null).map((s) => s.pct)),
    }))
    const allPct = per.flatMap((p) => p.rows.filter((s) => s.pct != null).map((s) => s.pct))

    const totals = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
    per.forEach((p) => p.rows.forEach((s) => Object.keys(totals).forEach((k) => { totals[k] += s[k] })))

    const allMeetings = details.flatMap(({ c, meetings }) =>
      meetings.map((m) => ({ ...m, label: `${c.course} ${c.name}` })))
    const meetings = allMeetings.map((m) => ({
      id: m.id, classId: m.classId, no: m.no, date: m.date, label: m.label, filled: m.filled > 0,
    }))

    const perStudent = {}
    per.forEach((p) => p.rows.forEach((s) => {
      if (s.pct != null) (perStudent[s.id] ??= { name: s.name, v: [] }).v.push(s.pct)
    }))
    const top = Object.entries(perStudent)
      .map(([id, s]) => ({ id: +id, name: s.name, pct: mean(s.v) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3)

    const perClass = per.map((p) => ({
      id: p.id, label: `${p.course} ${p.name}`, avg: p.avg, studentCount: p.studentCount,
    }))
    const trend = allMeetings
      .filter((m) => m.filled > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({ id: m.id, no: m.no, date: m.date, label: m.label, pct: r1((m.hadir / m.filled) * 100) }))

    return {
      counts: { classes: classes.length, students: students.length, meetings: allMeetings.length },
      avg: mean(allPct), totals, meetings, top, perClass, trend,
    }
  },
}