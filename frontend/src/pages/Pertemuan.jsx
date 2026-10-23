import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { CalendarDays, ClipboardCheck, ClipboardPen, Plus, Trash2 } from 'lucide-react'
import { ClassPicker, Confirm, Crumb, Empty, FormModal, PageHead, fmtDate, guard, useLoad, useToast } from '../components/ui'

export default function Pertemuan() {
  const { classId } = useParams()
  if (!classId) return <ClassPicker title="Pertemuan" sub="Pilih kelas untuk melihat dan membuat pertemuan." to="/pertemuan" action="Buka pertemuan" />
  return <Daftar classId={classId} />
}

function Daftar({ classId }) {
  const [d, reload, err] = useLoad(() => api.meetings(classId), [classId])
  const toast = useToast()
  const [m, setM] = useState(null)
  const g = guard(d, err)
  if (g) return g
  const c = d.class
  const next = Math.max(0, ...d.meetings.map((x) => x.no)) + 1

  return (
    <>
      <Crumb items={[['Pertemuan', '/pertemuan'], [`${c.course} ${c.name}`]]} />
      <PageHead title={`Pertemuan, ${c.course} ${c.name}`} sub={`${c.studentCount} mahasiswa terdaftar`}>
        <button className="btn" onClick={() => setM({ kind: 'add' })}><Plus size={16} />Buat pertemuan</button>
      </PageHead>
      {d.meetings.length ? (
        <div className="wrap"><table>
          <thead><tr><th>Pertemuan</th><th>Tanggal</th><th>Kehadiran</th><th /></tr></thead>
          <tbody>{d.meetings.map((x) => (
            <tr key={x.id}>
              <td>Ke-{x.no}</td><td>{fmtDate(x.date)}</td>
              <td>{x.filled ? `Terisi ${x.filled} dari ${c.studentCount} mahasiswa` : <span className="mut">Belum diisi</span>}</td>
              <td className="act">
                <Link className="btn sm" to={`/kehadiran/${x.id}`}>{x.filled ? <ClipboardCheck size={15} /> : <ClipboardPen size={15} />}{x.filled ? 'Ubah absen' : 'Isi absen'}</Link>
                <button className="btn danger sm" onClick={() => setM({ kind: 'del', item: x })} aria-label="Hapus pertemuan"><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <Empty title="Belum ada pertemuan" icon={CalendarDays}>Buat pertemuan pertama untuk kelas ini.</Empty>}

      {m?.kind === 'add' && (
        <FormModal title={`Buat pertemuan ke-${next}`} fields={[{ name: 'date', label: 'Tanggal', type: 'date' }]}
          initial={{ date: new Date().toISOString().slice(0, 10) }} onClose={() => setM(null)}
          onSubmit={async (v) => { await api.addMeeting(classId, v.date); toast('Pertemuan dibuat'); reload() }} />
      )}
      {m?.kind === 'del' && (
        <Confirm message="Pertemuan dan data kehadirannya akan dihapus." onClose={() => setM(null)}
          onYes={async () => { await api.deleteMeeting(m.item.id); toast('Pertemuan dihapus'); reload() }} />
      )}
    </>
  )
}
