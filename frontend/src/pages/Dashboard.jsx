import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, GraduationCap, PartyPopper, Percent, School, TrendingUp, Trophy } from 'lucide-react'
import { api } from '../api'
import { STATUS, STATUS_LABEL } from '../config'
import { Empty, PctBar, fmtDate, guard, initials, useLoad } from '../components/ui'
import { AreaChart, Donut, Gauge } from '../components/charts'

const BULAN = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES']
const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const WARNA = { hadir: '#124BFF', izin: '#6EA8E8', sakit: '#FFD43B', alpa: '#F0524F' }
const PODIUM = ['#124BFF', '#6EA8E8', '#FFD43B']
const shortDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

export default function Dashboard() {
  const [d, , err] = useLoad(() => api.dashboard())
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const g = guard(d, err)
  if (g) return g

  const { y, m } = ym
  const pad = (n) => String(n).padStart(2, '0')
  const lead = (new Date(y, m, 1).getDay() + 6) % 7
  const days = new Date(y, m + 1, 0).getDate()
  const byDate = {}
  d.meetings.forEach((x) => { (byDate[x.date] ??= []).push(x) })
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const shift = (n) => { const t = new Date(y, m + n, 1); setYm({ y: t.getFullYear(), m: t.getMonth() }) }
  const hasMonth = (i) => d.meetings.some((x) => x.date.startsWith(`${y}-${pad(i + 1)}`))

  const total = STATUS.reduce((a, s) => a + d.totals[s], 0)
  const hadirPct = total ? Math.round((d.totals.hadir / total) * 100) : 0
  const kosong = d.meetings.filter((x) => !x.filled).sort((a, b) => a.date.localeCompare(b.date))
  const trend = d.trend.map((t) => ({ ...t, short: shortDate(t.date) }))

  const stats = [
    { label: 'Total Kelas', v: d.counts.classes, Icon: School, tone: 'blue' },
    { label: 'Total Mahasiswa', v: d.counts.students, Icon: GraduationCap, tone: 'sky' },
    { label: 'Total Pertemuan', v: d.counts.meetings, Icon: CalendarDays, tone: 'yellow' },
    { label: 'Rata-rata Hadir', v: d.avg == null ? '-' : d.avg + '%', Icon: Percent, tone: 'navy' },
  ]

  return (
    <>
      <div className="head">
        <div><h1>Dashboard</h1><span className="mut">Ringkasan kehadiran semua kelas</span></div>
      </div>

      <div className="stats">
        {stats.map(({ label, v, Icon, tone }) => (
          <div className={'card stat ' + tone} key={label}>
            <div className="ic"><Icon size={24} /></div>
            <div><span className="mut">{label}</span><b>{v}</b></div>
          </div>
        ))}
      </div>

      <div className="dgrid">
        <section className="card span-8">
          <div className="between">
            <div><h2><TrendingUp size={18} />Tren Kehadiran</h2><span className="mut">Persentase hadir pada tiap pertemuan yang sudah diisi</span></div>
          </div>
          {trend.length ? <AreaChart points={trend} /> : <Empty title="Belum ada data" icon={Activity}>Isi kehadiran dulu untuk melihat grafik.</Empty>}
        </section>

        <section className="card span-4">
          <h2><Activity size={18} />Kehadiran per Status</h2>
          <span className="mut">Dari semua pertemuan yang sudah diisi</span>
          <div className="donut-wrap">
            <Donut size={176} thickness={24} big={hadirPct + '%'} small="hadir"
              data={STATUS.map((s) => ({ label: STATUS_LABEL[s], value: d.totals[s], color: WARNA[s] }))} />
            <ul className="dlegend">
              {STATUS.map((s) => (
                <li key={s}><i style={{ background: WARNA[s] }} /><span>{STATUS_LABEL[s]}</span><b>{d.totals[s]}</b>
                  <em>{total ? Math.round((d.totals[s] / total) * 100) : 0}%</em></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card span-4">
          <h2><Percent size={18} />Rata-rata Kehadiran</h2>
          <span className="mut">Seluruh kelas dan per kelas</span>
          <div className="gauge-wrap"><Gauge value={d.avg} size={190} label="rata-rata" /></div>
          <ul className="classbars">
            {d.perClass.map((c) => (
              <li key={c.id}>
                <div className="between"><span>{c.label}</span><small className="mut">{c.studentCount} mhs</small></div>
                <PctBar p={c.avg} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card span-8">
          <h2><CalendarDays size={18} />Kalender Pertemuan</h2>
          <div className="months">
            {BULAN.map((b, i) => (
              <button key={b} className={(hasMonth(i) ? 'has ' : '') + (i === m ? 'sel' : '')} onClick={() => setYm({ y, m: i })}>{b}</button>
            ))}
          </div>
          <div className="calnav">
            <button className="btn ghost sm icon" onClick={() => shift(-1)} aria-label="Bulan sebelumnya"><ChevronLeft size={16} /></button>
            <b>{BULAN_PANJANG[m]} {y}</b>
            <button className="btn ghost sm icon" onClick={() => shift(1)} aria-label="Bulan berikutnya"><ChevronRight size={16} /></button>
          </div>
          <div className="cal">
            {HARI.map((h) => <span className="h" key={h}>{h}</span>)}
            {Array.from({ length: lead }, (_, i) => <span className="blank" key={'b' + i} />)}
            {Array.from({ length: days }, (_, i) => {
              const n = i + 1, iso = `${y}-${pad(m + 1)}-${pad(n)}`, ms = byDate[iso]
              const cls = ms ? (ms.every((x) => x.filled) ? 'ok' : 'warn') : ''
              return <span key={n} className={cls + (iso === todayIso ? ' today' : '')}
                title={ms ? ms.map((x) => `${x.label}, pertemuan ke-${x.no}`).join('\n') : ''}>{n}</span>
            })}
          </div>
          <p className="legend-row"><i className="dot" style={{ background: 'var(--blue)' }} /> Sudah diisi <i className="dot" style={{ background: 'var(--yellow)' }} /> Belum diisi</p>
        </section>

        <section className="card span-6">
          <div className="between"><h2><CalendarCheck size={18} />Belum Diisi ({kosong.length})</h2><Link className="btn ghost sm" to="/kehadiran">Lihat semua<ArrowRight size={15} /></Link></div>
          {kosong.length ? (
            <ul className="list">
              {kosong.slice(0, 5).map((x) => (
                <li key={x.id}>
                  <span>{x.label}<br /><span className="mut">Pertemuan ke-{x.no}, {fmtDate(x.date)}</span></span>
                  <Link className="btn sm" to={`/kehadiran/${x.id}`}>Isi absen</Link>
                </li>
              ))}
            </ul>
          ) : <Empty title="Semua beres" icon={PartyPopper}>Semua pertemuan sudah terisi.</Empty>}
        </section>

        <section className="card span-6">
          <h2><Trophy size={18} />Kehadiran Tertinggi</h2>
          {d.top.length ? (
            <div className="top">
              {d.top.map((s, i) => (
                <div className="rank" key={s.id} style={{ '--c': PODIUM[i] }}>
                  <div className="avatar">{initials(s.name)}</div>
                  <b>{s.name}</b>
                  <div className="big">{s.pct}%</div>
                  <div className="pos">Peringkat {i + 1}</div>
                </div>
              ))}
            </div>
          ) : <Empty title="Belum ada data" icon={Trophy}>Isi kehadiran dulu untuk melihat peringkat.</Empty>}
        </section>
      </div>
    </>
  )
}
