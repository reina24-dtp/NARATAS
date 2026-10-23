import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { ArrowRight, BarChart3, CalendarDays, Pencil, Plus, School, Trash2, UserMinus, UserPlus, Users } from 'lucide-react'
import { Confirm, Crumb, Empty, FormModal, Modal, PageHead, Person, SearchInput, guard, useLoad, useToast } from '../components/ui'

const fields = [
  { name: 'course', label: 'Mata kuliah' },
  { name: 'name', label: 'Nama kelas' },
  { name: 'lecturer', label: 'Dosen' },
]

export default function Kelas() {
  const [list, reload, err] = useLoad(() => api.classes())
  const toast = useToast()
  const [q, setQ] = useState('')
  const [m, setM] = useState(null)
  const g = guard(list, err)
  if (g) return g
  const shown = list.filter((c) => (c.course + c.name + c.lecturer).toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHead title="Kelas" sub="Kelola data kelas dan anggotanya">
        <SearchInput placeholder="Cari kelas" value={q} onChange={setQ} />
        <button className="btn" onClick={() => setM({ kind: 'form' })}><Plus size={16} />Tambah kelas</button>
      </PageHead>
      {shown.length ? (
        <div className="grid">
          {shown.map((c) => (
            <div className="card class-card" key={c.id}>
              <span className="cic"><School size={22} /></span>
              <h3><Link to={`/kelas/${c.id}`}>{c.course}</Link></h3>
              <p className="mut">Kelas {c.name}, dosen {c.lecturer}</p>
              <p className="meta"><span><Users size={15} />{c.studentCount} mahasiswa</span><span><CalendarDays size={15} />{c.meetingCount} pertemuan</span></p>
              <div className="row">
                <Link className="btn sm" to={`/kelas/${c.id}`}><Users size={15} />Anggota</Link>
                <button className="btn ghost sm" onClick={() => setM({ kind: 'form', item: c })}><Pencil size={15} />Ubah</button>
                <button className="btn danger sm" onClick={() => setM({ kind: 'del', item: c })} aria-label="Hapus kelas"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty title="Belum ada kelas" icon={School}>Tambahkan kelas pertama untuk mulai mencatat kehadiran.</Empty>}

      {m?.kind === 'form' && (
        <FormModal title={m.item ? 'Ubah kelas' : 'Tambah kelas'} fields={fields} initial={m.item || {}} onClose={() => setM(null)}
          onSubmit={async (v) => { await api.saveClass(v, m.item?.id); toast('Kelas tersimpan'); reload() }} />
      )}
      {m?.kind === 'del' && (
        <Confirm message="Kelas beserta pertemuan dan absensinya akan dihapus." onClose={() => setM(null)}
          onYes={async () => { await api.deleteClass(m.item.id); toast('Kelas dihapus'); reload() }} />
      )}
    </>
  )
}

/* Detail kelas: daftar mahasiswa terdaftar + mendaftarkan mahasiswa ke kelas */
export function KelasDetail() {
  const { id } = useParams()
  const [d, reload, err] = useLoad(() => api.classDetail(id), [id])
  const toast = useToast()
  const [m, setM] = useState(null)
  const [q, setQ] = useState('')
  const g = guard(d, err)
  if (g) return g
  const c = d.class
  const shown = d.students.filter((s) => (s.nim + s.name).toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <Crumb items={[['Kelas', '/kelas'], [`${c.course} ${c.name}`]]} />
      <PageHead title={`${c.course}, ${c.name}`} sub={`Dosen: ${c.lecturer}`}>
        <Link className="btn ghost" to={`/pertemuan/${c.id}`}><CalendarDays size={16} />Pertemuan</Link>
        <Link className="btn ghost" to={`/rekap/${c.id}`}><BarChart3 size={16} />Rekap</Link>
      </PageHead>
      <div className="head sub">
        <h2>Mahasiswa terdaftar ({d.students.length})</h2>
        <div className="tools">
          <SearchInput placeholder="Cari mahasiswa" value={q} onChange={setQ} />
          <button className="btn" onClick={() => setM({ kind: 'enroll' })}><UserPlus size={16} />Daftarkan mahasiswa</button>
        </div>
      </div>
      {shown.length ? (
        <div className="wrap"><table>
          <thead><tr><th>NIM</th><th>Nama</th><th /></tr></thead>
          <tbody>{shown.map((s) => (
            <tr key={s.id}><td>{s.nim}</td><td><Person name={s.name} /></td>
              <td className="act"><button className="btn danger sm" onClick={() => setM({ kind: 'out', item: s })}><UserMinus size={15} />Keluarkan</button></td></tr>
          ))}</tbody>
        </table></div>
      ) : <Empty title="Belum ada mahasiswa di kelas ini" icon={Users}>Klik "Daftarkan mahasiswa" untuk memilih dari daftar mahasiswa.</Empty>}

      {m?.kind === 'enroll' && (
        <EnrollModal classId={c.id} enrolled={d.students.map((s) => s.id)} onClose={() => setM(null)}
          onDone={(n) => { toast(`${n} mahasiswa didaftarkan`); setM(null); reload() }} />
      )}
      {m?.kind === 'out' && (
        <Confirm message={`${m.item.name} dikeluarkan dari kelas ini. Absensinya di kelas ini ikut terhapus.`} onClose={() => setM(null)}
          onYes={async () => { await api.unenroll(c.id, m.item.id); toast('Mahasiswa dikeluarkan'); reload() }} />
      )}
    </>
  )
}

function EnrollModal({ classId, enrolled, onClose, onDone }) {
  const [all] = useLoad(() => api.students())
  const [sel, setSel] = useState([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const rest = (all || []).filter((s) => !enrolled.includes(s.id) && (s.nim + s.name).toLowerCase().includes(q.toLowerCase()))
  const toggle = (id) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id])
  async function go() {
    if (!sel.length) return setErr('Pilih minimal satu mahasiswa.')
    await api.enroll(classId, sel)
    onDone(sel.length)
  }
  return (
    <Modal title="Daftarkan mahasiswa" onClose={onClose}>
      <SearchInput placeholder="Cari NIM atau nama" value={q} onChange={setQ} />
      <div className="pick">
        {rest.length ? rest.map((s) => (
          <label key={s.id}><input type="checkbox" checked={sel.includes(s.id)} onChange={() => toggle(s.id)} />{s.nim} {s.name}</label>
        )) : <p className="mut pad">Tidak ada mahasiswa yang bisa didaftarkan.</p>}
      </div>
      {err && <p className="err">{err}</p>}
      <div className="row end">
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn" onClick={go}><UserPlus size={16} />Daftarkan</button>
      </div>
    </Modal>
  )
}
