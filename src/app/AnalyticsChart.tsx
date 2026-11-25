import { formatVnd } from '../lib/format'

type Series = { key: 'collected' | 'refunded' | 'expenses'; label: string; color: string }
type Point = { label: string; collected: number; refunded: number; expenses: number }

const series: Series[] = [
  { key: 'collected', label: 'Tiền đã thu', color: '#d9b66f' },
  { key: 'refunded', label: 'Tiền hoàn lại', color: '#a8c9bd' },
  { key: 'expenses', label: 'Chi phí', color: '#e28f78' },
]

function pointPath(values: number[], max: number, width: number, height: number) {
  const left = 34, right = width - 16, top = 18, bottom = height - 30
  return values.map((value, index) => {
    const x = values.length <= 1 ? (left + right) / 2 : left + (right - left) * index / (values.length - 1)
    const y = bottom - (value / max) * (bottom - top)
    return (index ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
  }).join(' ')
}

export function AnalyticsChart({ data }: { data: Point[] }) {
  const width = 900, height = 300
  const max = Math.max(1, ...data.flatMap(row => [row.collected, row.refunded, row.expenses]))
  const left = 34, right = width - 16, top = 18, bottom = height - 30
  const ticks = [0, .25, .5, .75, 1]
  return <div className="analytics-visual">
    <div className="analytics-legend">{series.map(item => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}</div>
    <div className="analytics-chart-scroll">
      <svg className="analytics-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ đường thể hiện tiền đã thu, tiền hoàn lại và chi phí theo thời gian">
        <defs>
          <linearGradient id="analytics-gold-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d9b66f" stopOpacity=".28"/><stop offset="100%" stopColor="#d9b66f" stopOpacity="0"/></linearGradient>
        </defs>
        {ticks.map(tick => {
          const y = bottom - tick * (bottom - top)
          return <g key={tick}><line x1={left} x2={right} y1={y} y2={y} className="analytics-gridline"/><text x="27" y={y + 4} textAnchor="end" className="analytics-axis-label">{tick === 0 ? '0' : Math.round(max * tick / 1000).toLocaleString('vi-VN') + 'k'}</text></g>
        })}
        {data.length > 1 && <path d={pointPath(data.map(row => row.collected), max, width, height) + ` L ${right} ${bottom} L ${left} ${bottom} Z`} fill="url(#analytics-gold-area)"/>}
        {series.map(item => {
          const path = pointPath(data.map(row => row[item.key]), max, width, height)
          return <g key={item.key}><path d={path} fill="none" stroke={item.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="analytics-line"/>{data.map((row,index) => {
            const x = data.length <= 1 ? (left + right) / 2 : left + (right-left)*index/(data.length-1)
            const y = bottom - (row[item.key]/max)*(bottom-top)
            return <circle key={row.label + item.key} cx={x} cy={y} r="4" fill={item.color} stroke="#103e35" strokeWidth="2"><title>{row.label} · {item.label}: {formatVnd(row[item.key])}</title></circle>
          })}</g>
        })}
        {data.map((row,index) => {
          const x = data.length <= 1 ? (left + right) / 2 : left + (right-left)*index/(data.length-1)
          return <text key={row.label} x={x} y={height-8} textAnchor="middle" className="analytics-axis-label">{row.label}</text>
        })}
      </svg>
    </div>
    <div className="analytics-detail-grid">{series.map(item => <div key={item.key}><small>{item.label}</small><b>{formatVnd(data.reduce((sum,row)=>sum+row[item.key],0))}</b></div>)}</div>
  </div>
}
