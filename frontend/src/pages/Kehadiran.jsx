import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { STATUS, STATUS_LABEL } from '../config'
import { CalendarDays, Check, ClipboardCheck, ClipboardPen, CheckCheck, Save, School, Stethoscope, FileText, Users, X } from 'lucide-react'
import { Crumb, Empty, PageHead, Person, fmtDate, guard, useLoad, useToast } from '../components/ui'

const SIKON = { hadir: Check, izin: FileText, sakit: Stethoscope, alpa: X }

export default function Kehadiran() {
  const { meetingId } = useParams()
  return meetingId ? <Input meetingId={meetingId} /> : <Pilih />
}

/* Daftar semua pertemuan (semua kelas) untuk dipilih */
function Pilih() {
  const [list, , err] = useLoad(() => api.meetingsAll())
  const g = guard(list, err)
  return (
    <>
      <PageHead title="Input Kehadiran" sub="Pilih pertemuan yang ingin diisi kehadirannya." />
      {g || (list.length ? list.map((c) => (
        <section key={c.id}>
          <h2 className="sec">{c.course}, {c.name}</h2>
          {c.meetings.length ? (
            <div className="wrap"><table><tbody>{c.meetings.map((m) => (
              <tr key={m.id}>
                <td>Pertemuan ke-{m.no}</td><td>{fmtDate(m.date)}</td>
                <td>{m.filled ? `Terisi ${m.filled} dari ${c.studentCount}` : <span className="mut">Belum diisi</span>}</td>
                <td className="act"><Link className="btn sm" to={`/kehadiran/${m.id}`}>{m.filled ? <ClipboardCheck size={15} /> : <ClipboardPen size={15} />}{m.filled ? 'Ubah absen' : 'Isi absen'}</Link></td>
              </tr>
            ))}</tbody></table></div>
          ) : <Empty title="Belum ada pertemuan" icon={CalendarDays}><Link to={`/pertemuan/${c.id}`}>Buat pertemuan</Link></Empty>}
        </section>
      )) : <Empty title="Belum ada kelas" icon={School}>Tambahkan kelas di menu Kelas dulu.</Empty>)}
    </>
  )
}

/* Satu layar untuk seluruh mahasiswa kelas */
function Input({ meetingId }) {
  const [d, , err] = useLoad(() => api.attendance(meetingId), [meetingId])
  const toast = useToast()
  const [draft, setDraft] = useState({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (d) { setDraft(Object.fromEntries(d.students.filter((s) => s.status).map((s) => [s.id, s.status]))); setDirty(false) }
  }, [d])
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const g = guard(d, err)
  if (g) return g
  const { meeting, students } = d
  const c = d.class
  const set = (id, s) => { setDraft({ ...draft, [id]: s }); setDirty(true) }
  const all = () => { setDraft(Object.fromEntries(students.map((s) => [s.id, 'hadir']))); setDirty(true) }
  const blank = students.filter((s) => !draft[s.id]).length
  async function save() {
    if (blank) return toast(`${blank} mahasiswa belum diisi statusnya`, true)
    try { await api.saveAttendance(meetingId, draft); setDirty(false); toast('Kehadiran disimpan') } catch (x) { toast(x.message, true) }
  }

  return (
    <>
      <Crumb items={[['Kehadiran', '/kehadiran'], [`${c.course} ${c.name}`, `/pertemuan/${c.id}`], [`Pertemuan ke-${meeting.no}`]]} />
      <PageHead title={`Absensi pertemuan ke-${meeting.no}`} sub={`${fmtDate(meeting.date)}, ${c.course} ${c.name}`}>
        <button className="btn ghost" onClick={all}><CheckCheck size={16} />Tandai semua hadir</button>
      </PageHead>
      {students.length ? (
        <>
          <div className="chips">
            {STATUS.map((s) => <span key={s} className={'chip ' + s}>{STATUS_LABEL[s]} {students.filter((x) => draft[x.id] === s).length}</span>)}
            <span className="chip blank">Belum diisi {blank}</span>
          </div>
          <div className="wrap calm"><table>
            <thead><tr><th>No</th><th>NIM</th><th>Nama</th><th>Status</th></tr></thead>
            <tbody>{students.map((s, i) => (
              <tr key={s.id}><td>{i + 1}</td><td>{s.nim}</td><td><Person name={s.name} /></td>
                <td className="segs">{STATUS.map((k) => (
                  <button key={k} type="button" className={`seg ${k} ${draft[s.id] === k ? 'on' : ''}`} aria-pressed={draft[s.id] === k} onClick={() => set(s.id, k)}>{(() => { const I = SIKON[k]; return <I size={14} /> })()}{STATUS_LABEL[k]}</button>
                ))}</td></tr>
            ))}</tbody>
          </table></div>
          <div className="savebar">
            <span className="mut">{dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'}</span>
            <button className="btn" onClick={save}><Save size={16} />Simpan kehadiran</button>
          </div>
        </>
      ) : <Empty title="Belum ada mahasiswa di kelas ini" icon={Users}>Daftarkan mahasiswa dulu di <Link to={`/kelas/${c.id}`}>halaman kelas</Link>.</Empty>}
    </>
  )
}
