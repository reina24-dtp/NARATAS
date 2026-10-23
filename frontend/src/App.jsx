import { useState } from 'react'
import { NavLink, Route, Routes, Link } from 'react-router-dom'
import { BarChart3, CalendarDays, CalendarRange, ClipboardCheck, GraduationCap, LayoutDashboard, School, SearchX } from 'lucide-react'
import { SEMESTER } from './config'
import { Empty, Logo, Splash, ToastProvider } from './components/ui'
import Dashboard from './pages/Dashboard'
import Kelas, { KelasDetail } from './pages/Kelas'
import Mahasiswa from './pages/Mahasiswa'
import Pertemuan from './pages/Pertemuan'
import Kehadiran from './pages/Kehadiran'
import Rekap from './pages/Rekap'

const MENU = [
  ['/', 'Dashboard', LayoutDashboard], ['/kelas', 'Kelas', School], ['/mahasiswa', 'Mahasiswa', GraduationCap],
  ['/pertemuan', 'Pertemuan', CalendarDays], ['/kehadiran', 'Kehadiran', ClipboardCheck], ['/rekap', 'Rekap', BarChart3],
]

export default function App() {
  const [splash, setSplash] = useState(() => {
    try { return !sessionStorage.getItem('splash') } catch { return true }
  })
  const done = () => {
    try { sessionStorage.setItem('splash', '1') } catch { /* abaikan */ }
    setSplash(false)
  }
  return (
    <ToastProvider>
      {splash && <Splash onDone={done} />}
      <header className="topnav">
        <Link to="/" className="brand" aria-label="NARATAS, ke dashboard"><Logo height={40} /></Link>
        <div className="top-right">
          <span className="sem"><CalendarRange size={16} />{SEMESTER}</span>
        </div>
      </header>
      <div className="shell">
        <aside className="side">
          <nav aria-label="Menu utama">
            {MENU.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={19} /><span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kelas" element={<Kelas />} />
            <Route path="/kelas/:id" element={<KelasDetail />} />
            <Route path="/mahasiswa" element={<Mahasiswa />} />
            <Route path="/pertemuan" element={<Pertemuan />} />
            <Route path="/pertemuan/:classId" element={<Pertemuan />} />
            <Route path="/kehadiran" element={<Kehadiran />} />
            <Route path="/kehadiran/:meetingId" element={<Kehadiran />} />
            <Route path="/rekap" element={<Rekap />} />
            <Route path="/rekap/:classId" element={<Rekap />} />
            <Route path="*" element={<Empty title="Halaman tidak ditemukan" icon={SearchX}><Link to="/">Kembali ke dashboard</Link></Empty>} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  )
}
