import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2, ChevronRight, Inbox, Loader2, School, Search, Trash2, Users, CalendarDays } from 'lucide-react'
import { api } from '../api'
import { SPLASH_MS } from '../config'

/* ---------- Logo NARATAS (file ada di folder public) ---------- */
export function Logo({ height = 40, mark = false, className = '' }) {
  return <img className={'logo ' + className} src={mark ? '/naratas-mark.png' : '/naratas-logo.png'} alt="NARATAS Class Management System" style={{ height }} draggable="false" />
}

/* ---------- Layar pembuka: loading berjalan sampai selesai, tanpa tombol lewati ---------- */
export function Splash({ onDone }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), SPLASH_MS)
    const t2 = setTimeout(onDone, SPLASH_MS + 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div className={'splash' + (out ? ' out' : '')} role="status" aria-label="Memuat aplikasi">
      <div className="splash-in">
        <Logo height={120} className="splash-logo" />
        <div className="load"><i style={{ animationDuration: SPLASH_MS + 'ms' }} /></div>
      </div>
    </div>
  )
}

/* ---------- Helper ---------- */
export const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
export const initials = (n) => n.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
export const pctClass = (p) => (p >= 75 ? 'good' : p >= 50 ? 'mid' : 'low')

export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => fn().then((d) => { setErr(null); setData(d) }).catch(setErr), deps)
  useEffect(() => { setData(null); load() }, [load])
  return [data, load, err]
}

export const Loading = () => <p className="loading"><Loader2 size={18} className="spin" /> Memuat data</p>
export const Empty = ({ title, children, icon: I = Inbox }) => (
  <div className="empty"><span className="empty-ic"><I size={26} /></span><h3>{title}</h3><p>{children}</p></div>
)
export const guard = (d, err) => (err ? <Empty title="Terjadi masalah" icon={AlertCircle}>{err.message}</Empty> : !d ? <Loading /> : null)

export function PageHead({ title, sub, children }) {
  return (
    <div className="head">
      <div><h1>{title}</h1>{sub && <span className="mut">{sub}</span>}</div>
      <div className="tools">{children}</div>
    </div>
  )
}

export function Crumb({ items }) {
  return (
    <div className="crumb">
      {items.map(([t, to], i) => (
        <span key={i}>{i > 0 && <ChevronRight size={14} />}{to ? <Link to={to}>{t}</Link> : t}</span>
      ))}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Cari', label }) {
  return (
    <label className="searchbox">
      <Search size={16} />
      <input placeholder={placeholder} aria-label={label || placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function Person({ name, sub }) {
  return (
    <span className="person">
      <span className="av">{initials(name)}</span>
      <span><b>{name}</b>{sub && <small>{sub}</small>}</span>
    </span>
  )
}

export function PctBar({ p }) {
  if (p == null) return <span className="mut">-</span>
  return <span className="pctbar"><span className="bar"><i className={pctClass(p)} style={{ width: p + '%' }} /></span><b>{p}%</b></span>
}

/* ---------- Toast ---------- */
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }) {
  const [t, setT] = useState(null)
  const timer = useRef(0)
  const show = useCallback((msg, bad) => {
    setT({ msg, bad })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setT(null), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && <div className={'toast' + (t.bad ? ' bad' : '')} role="status">{t.bad ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}{t.msg}</div>}
    </ToastCtx.Provider>
  )
}

/* ---------- Modal ---------- */
export function Modal({ title, children, onClose, icon }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true"><h3>{icon}{title}</h3>{children}</div>
    </div>
  )
}

export function FormModal({ title, fields, initial = {}, onSubmit, onClose, label = 'Simpan' }) {
  const [v, setV] = useState(initial)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try { await onSubmit(v); onClose() } catch (x) { setErr(x.message); setBusy(false) }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit}>
        {fields.map((f, i) => (
          <label key={f.name}>{f.label}
            <input type={f.type || 'text'} value={v[f.name] ?? ''} autoFocus={i === 0}
              onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />
          </label>
        ))}
        {err && <p className="err">{err}</p>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>Batal</button>
          <button className="btn" disabled={busy}>{label}</button>
        </div>
      </form>
    </Modal>
  )
}

export function Confirm({ message, onYes, onClose }) {
  const [busy, setBusy] = useState(false)
  async function go() { setBusy(true); await onYes(); onClose() }
  return (
    <Modal title="Yakin?" onClose={onClose} icon={<span className="m-ic"><Trash2 size={18} /></span>}>
      <p>{message}</p>
      <div className="row end">
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn danger solid" onClick={go} disabled={busy}><Trash2 size={16} />Hapus</button>
      </div>
    </Modal>
  )
}

/* ---------- Pilih kelas (dipakai halaman Pertemuan dan Rekap) ---------- */
export function ClassPicker({ title, sub, to, action }) {
  const [list, , err] = useLoad(() => api.classes())
  const g = guard(list, err)
  return (
    <>
      <PageHead title={title} sub={sub} />
      {g || (list.length ? (
        <div className="grid">
          {list.map((c) => (
            <div className="card class-card" key={c.id}>
              <span className="cic"><School size={22} /></span>
              <h3>{c.course}</h3>
              <p className="mut">Kelas {c.name}, {c.lecturer}</p>
              <p className="meta"><span><Users size={15} />{c.studentCount} mahasiswa</span><span><CalendarDays size={15} />{c.meetingCount} pertemuan</span></p>
              <div className="row"><Link className="btn sm" to={`${to}/${c.id}`}>{action}<ArrowRight size={15} /></Link></div>
            </div>
          ))}
        </div>
      ) : <Empty title="Belum ada kelas" icon={School}>Tambahkan kelas di menu Kelas dulu.</Empty>)}
    </>
  )
}
