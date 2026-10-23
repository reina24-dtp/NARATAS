import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { BarChart3, CalendarCheck, Download, GraduationCap, Percent } from 'lucide-react'
import { ClassPicker, Crumb, Empty, PageHead, PctBar, Person, SearchInput, guard, useLoad } from '../components/ui'

export default function Rekap() {
  const { classId } = useParams()
  if (!classId) return <ClassPicker title="Rekap Kehadiran" sub="Pilih kelas untuk melihat rekap." to="/rekap" action="Lihat rekap" />
  return <Tampil classId={classId} />
}

function Tampil({ classId }) {
  const [d, , err] = useLoad(() => api.rekap(classId), [classId])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('nama')
  const g = guard(d, err)
  if (g) return g
  const c = d.class
  const vals = d.rows.filter((s) => s.pct != null).map((s) => s.pct)
  const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
  const rows = d.rows
    .filter((s) => (s.nim + s.name).toLowerCase().includes(q.toLowerCase()))
    .sort(sort === 'nama' ? (a, b) => a.name.localeCompare(b.name) : sort === 'rendah' ? (a, b) => (a.pct ?? 101) - (b.pct ?? 101) : (a, b) => (b.pct ?? -1) - (a.pct ?? -1))

  function csv() {
    const lines = ['NIM,Nama,Hadir,Izin,Sakit,Alpa,Persen', ...d.rows.map((s) => [s.nim, `"${s.name.replace(/"/g, '""')}"`, s.hadir, s.izin, s.sakit, s.alpa, s.pct ?? ''].join(','))]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    a.download = `rekap-${c.name}.csv`
    a.click()
  }

  return (
    <>
      <Crumb items={[['Rekap', '/rekap'], [`${c.course} ${c.name}`]]} />
      <PageHead title={`Rekap, ${c.course} ${c.name}`} sub={`Dosen: ${c.lecturer}`}>
        <button className="btn ghost" onClick={csv}><Download size={16} />Unduh CSV</button>
      </PageHead>
      <div className="stats">
        <div className="card stat sky"><div className="ic"><GraduationCap size={24} /></div><div><span className="mut">Mahasiswa</span><b>{d.rows.length}</b></div></div>
        <div className="card stat yellow"><div className="ic"><CalendarCheck size={24} /></div><div><span className="mut">Pertemuan terisi</span><b>{d.total}</b></div></div>
        <div className="card stat blue"><div className="ic"><Percent size={24} /></div><div><span className="mut">Rata-rata kehadiran</span><b>{avg == null ? '-' : avg + '%'}</b></div></div>
      </div>
      <div className="head sub">
        <h2>Per mahasiswa</h2>
        <div className="tools">
          <SearchInput placeholder="Cari NIM atau nama" value={q} onChange={setQ} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Urutkan">
            <option value="nama">Urut nama</option><option value="rendah">Kehadiran terendah</option><option value="tinggi">Kehadiran tertinggi</option>
          </select>
        </div>
      </div>
      {d.rows.length ? (
        <>
          <div className="wrap"><table>
            <thead><tr><th>NIM</th><th>Nama</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpa</th><th>% Kehadiran</th></tr></thead>
            <tbody>{rows.map((s) => (
              <tr key={s.id}><td>{s.nim}</td><td><Person name={s.name} /></td><td>{s.hadir}</td><td>{s.izin}</td><td>{s.sakit}</td><td>{s.alpa}</td><td><PctBar p={s.pct} /></td></tr>
            ))}</tbody>
          </table></div>
          <p className="mut">Persentase = Hadir dibagi jumlah pertemuan yang sudah diisi. Izin dan sakit tidak dihitung hadir. Biru 75% ke atas, kuning 50 sampai 74%, merah di bawah 50%.</p>
        </>
      ) : <Empty title="Belum ada data" icon={BarChart3}>Daftarkan mahasiswa dan isi kehadiran dulu.</Empty>}
    </>
  )
}
