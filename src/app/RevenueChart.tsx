import { formatVnd } from '../lib/format'
import type { RevenueBucket } from './PosReportsPages'

type RevenueChartProps={
 buckets:RevenueBucket[]
 totals:{collected:number;refunded:number;expenses:number;net:number}
}
const COLORS={collected:'#0f806b',refunded:'#8b5cf6',expenses:'#d6a34c'}
function compactVnd(value:number){return new Intl.NumberFormat('vi-VN',{notation:'compact',maximumFractionDigits:1}).format(value)}
export function RevenueChart({buckets,totals}:RevenueChartProps){
 const width=Math.max(960,buckets.length*34),height=320
 const left=76,right=22,top=26,bottom=54,plotWidth=width-left-right,plotHeight=height-top-bottom
 const maxValue=Math.max(1,...buckets.flatMap(row=>[row.collected,row.refunded,row.expenses]))
 const groupWidth=plotWidth/Math.max(1,buckets.length)
 const barWidth=Math.min(22,Math.max(3,groupWidth*.22))
 const labelStep=Math.max(1,Math.ceil(buckets.length/10))
 const series:[keyof RevenueBucket,string,string][]=[
  ['collected','Đã thu',COLORS.collected],['refunded','Hoàn tiền',COLORS.refunded],['expenses','Chi phí',COLORS.expenses],
 ]
 return <div className="report-chart-shell">
  <div className="report-chart-heading"><div><h4>Biến động thu – hoàn – chi</h4><p>So sánh các khoản giao dịch theo ngày hoặc tháng trong kỳ đã chọn.</p></div></div>
  <div className="report-chart-legend"><span><i className="collected"/>Tiền đã thu</span><span><i className="refunded"/>Hoàn tiền</span><span><i className="expenses"/>Chi phí</span></div>
  <div className="report-chart-scroll">
   <svg className="report-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ cột nhóm tiền đã thu, hoàn tiền và chi phí">
    <defs>
     <linearGradient id="report-collected-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2bb99b"/><stop offset="100%" stopColor="#0b6656"/></linearGradient>
     <linearGradient id="report-refunded-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient>
     <linearGradient id="report-expenses-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5d18a"/><stop offset="100%" stopColor="#c58a2c"/></linearGradient>
    </defs>
    {[0,.25,.5,.75,1].map(f=>{
      const y=top+plotHeight*(1-f),value=maxValue*f
      return <g key={f}><line x1={left} x2={width-right} y1={y} y2={y} stroke="#d9e4dc" strokeWidth="1" strokeDasharray={f===0?'0':'4 5'}/><text x={left-12} y={y+4} textAnchor="end" fontSize="12" fill="#6a7d72">{compactVnd(value)}</text></g>
    })}
    {buckets.map((bucket,index)=>{
      const center=left+groupWidth*(index+.5),groupOffset=barWidth*1.65
      const labelVisible=index%labelStep===0||index===buckets.length-1
      return <g key={bucket.label+'-'+index}>
       {series.map(([key,label,color],seriesIndex)=>{
        const value=bucket[key] as number
        const barHeight=value>0?Math.max(2,value/maxValue*plotHeight):0
        const x=center+(seriesIndex-1)*groupOffset-barWidth/2,y=top+plotHeight-barHeight
        const fill=key==='collected'?'url(#report-collected-gradient)':key==='refunded'?'url(#report-refunded-gradient)':'url(#report-expenses-gradient)'
        return <g key={key}><rect x={x} y={y} width={barWidth} height={barHeight} rx={Math.min(5,barWidth/3)} fill={fill}><title>{bucket.label} · {label}: {formatVnd(value)}</title></rect></g>
       })}
       {labelVisible&&<text x={center} y={top+plotHeight+25} textAnchor="middle" fontSize="12" fill="#5c7165">{bucket.label}</text>}
      </g>
    })}
   </svg>
  </div>
  <div className="report-chart-footer"><span>Đã thu <strong>{formatVnd(totals.collected)}</strong></span><span>Hoàn tiền <strong>{formatVnd(totals.refunded)}</strong></span><span>Chi phí <strong>{formatVnd(totals.expenses)}</strong></span><span>Thu ròng <strong>{formatVnd(totals.net)}</strong></span></div>
 </div>
}
