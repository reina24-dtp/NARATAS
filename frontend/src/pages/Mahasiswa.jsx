import { useState } from 'react'
import { api } from '../api'
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react'
import { Confirm, Empty, FormModal, PageHead, Person, SearchInput, guard, useLoad, useToast } from '../components/ui'

const fields = [{ name: 'nim', label: 'NIM' }, { name: 'name', label: 'Nama' }]

export default function Mahasiswa() {
  const [list, reload, err] = useLoad(() => api.students())
  const toast = useToast()
  const [q, setQ] = useState('')
  const [m, setM] = useState(null)
  const g = guard(list, err)
  if (g) return g
  const shown = list.filter((s) => (s.nim + s.name).toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHead title="Mahasiswa" sub="Data induk mahasiswa">
        <SearchInput placeholder="Cari NIM atau nama" value={q} onChange={setQ} />
        <button className="btn" onClick={() => setM({ kind: 'form' })}><Plus size={16} />Tambah mahasiswa</button>
      </PageHead>
      {shown.length ? (
        <div className="wrap"><table>
          <thead><tr><th>NIM</th><th>Nama</th><th /></tr></thead>
          <tbody>{shown.map((s) => (
            <tr key={s.id}><td>{s.nim}</td><td><Person name={s.name} /></td>
              <td className="act">
                <button className="btn ghost sm" onClick={() => setM({ kind: 'form', item: s })}><Pencil size={15} />Ubah</button>
                <button className="btn danger sm" onClick={() => setM({ kind: 'del', item: s })} aria-label="Hapus mahasiswa"><Trash2 size={15} /></button>
              </td></tr>
          ))}</tbody>
        </table></div>
      ) : <Empty title="Belum ada mahasiswa" icon={GraduationCap}>Tambahkan mahasiswa, lalu daftarkan ke kelas.</Empty>}

      {m?.kind === 'form' && (
        <FormModal title={m.item ? 'Ubah mahasiswa' : 'Tambah mahasiswa'} fields={fields} initial={m.item || {}} onClose={() => setM(null)}
          onSubmit={async (v) => { await api.saveStudent(v, m.item?.id); toast('Mahasiswa tersimpan'); reload() }} />
      )}
      {m?.kind === 'del' && (
        <Confirm message="Mahasiswa akan dihapus dari semua kelas beserta data absensinya." onClose={() => setM(null)}
          onYes={async () => { await api.deleteStudent(m.item.id); toast('Mahasiswa dihapus'); reload() }} />
      )}
    </>
  )
}
