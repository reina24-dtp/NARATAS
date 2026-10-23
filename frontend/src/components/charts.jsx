import { useState } from 'react'

/* Grafik ringan berbasis SVG, tanpa library tambahan. */

export function Donut({ data, size = 190, thickness = 26, big, small }) {
  const total = data.reduce((a, d) => a + d.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Diagram lingkaran kehadiran">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--soft)" strokeWidth={thickness} />
        {total > 0 && data.map((d) => {
          const len = (d.value / total) * c
          const el = d.value > 0 && (
            <circle key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
              strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`} strokeDashoffset={-acc}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              <title>{d.label}: {d.value}</title>
            </circle>
          )
          acc += len
          return el
        })}
      </svg>
      <div className="donut-c"><b>{big}</b><span>{small}</span></div>
    </div>
  )
}

export function Gauge({ value, size = 150, label }) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value))
  const w = 16, r = (size - w) / 2, c = Math.PI * r // setengah lingkaran
  return (
    <div className="gauge" style={{ width: size }}>
      <svg width={size} height={size / 2 + w} viewBox={`0 0 ${size} ${size / 2 + w}`} role="img" aria-label={`${label}: ${value ?? 0}%`}>
        <path d={`M ${w / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - w / 2} ${size / 2}`} fill="none" stroke="var(--soft)" strokeWidth={w} strokeLinecap="round" />
        <path d={`M ${w / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - w / 2} ${size / 2}`} fill="none" stroke="var(--blue)" strokeWidth={w} strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`} />
      </svg>
      <div className="gauge-c"><b>{value == null ? '-' : value + '%'}</b><span>{label}</span></div>
    </div>
  )
}

export function AreaChart({ points, height = 230 }) {
  const [hover, setHover] = useState(null)
  const W = 640, H = height, L = 38, R = 14, T = 16, B = 30
  const iw = W - L - R, ih = H - T - B
  const n = points.length
  const x = (i) => L + (n === 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v) => T + ih - (v / 100) * ih
  const line = points.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p.pct)}`).join(' ')
  const area = `${line} L ${x(n - 1)} ${T + ih} L ${x(0)} ${T + ih} Z`
  const step = Math.max(1, Math.ceil(n / 7))
  const sel = hover != null ? points[hover] : null
  return (
    <div className="areachart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafik tren kehadiran" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#124BFF" stopOpacity=".28" />
            <stop offset="100%" stopColor="#124BFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeDasharray={g ? '4 4' : ''} />
            <text x={L - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--mut)">{g}%</text>
          </g>
        ))}
        <path d={area} fill="url(#areaG)" />
        <path d={line} fill="none" stroke="var(--blue)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.id}>
            {i % step === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--mut)">{p.short}</text>}
            <circle cx={x(i)} cy={y(p.pct)} r={hover === i ? 7 : 5} fill="#fff" stroke="var(--blue)" strokeWidth="3" />
            <rect x={x(i) - iw / n / 2} y={T} width={Math.max(iw / n, 16)} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} />
          </g>
        ))}
        {sel && (
          <g pointerEvents="none">
            <rect x={Math.min(Math.max(x(hover) - 80, L), W - R - 160)} y={Math.max(y(sel.pct) - 58, 2)} width="160" height="44" rx="8" fill="var(--navy)" />
            <text x={Math.min(Math.max(x(hover) - 80, L), W - R - 160) + 10} y={Math.max(y(sel.pct) - 58, 2) + 18} fontSize="11.5" fill="#fff" fontWeight="600">{sel.label.slice(0, 24)}</text>
            <text x={Math.min(Math.max(x(hover) - 80, L), W - R - 160) + 10} y={Math.max(y(sel.pct) - 58, 2) + 35} fontSize="11.5" fill="#FFD43B">Pertemuan ke-{sel.no}: {sel.pct}%</text>
          </g>
        )}
      </svg>
    </div>
  )
}
