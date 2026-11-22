import { useEffect, useState } from 'react'
import { CalendarDays, Users, Scissors, Package, Wallet, RefreshCw } from 'lucide-react'
import { useOwnerContext } from '../auth/OwnerContext'
import { getSalesReport, listAppointments, listCustomers, listEmployees, listInventoryLots, listProducts } from '../db/repositories'
import type { Appointment, Customer, Employee, InventoryLot, Product } from '../db/types'
import { formatVnd } from '../lib/format'

type DashboardData={appointments:Appointment[];customers:Customer[];employees:Employee[];products:Product[];lots:InventoryLot[];revenue:number}
const empty:DashboardData={appointments:[],customers:[],employees:[],products:[],lots:[],revenue:0}
const dayStart=()=>{const d=new Date();d.setHours(0,0,0,0);return d}
const monthStart=()=>{const d=new Date();d.setDate(1);d.setHours(0,0,0,0);return d}
export function DashboardPage(){
 const actor=useOwnerContext()
 const [data,setData]=useState<DashboardData>(empty)
 const [busy,setBusy]=useState(true)
 const [error,setError]=useState('')
 async function reload(){
  setBusy(true);setError('')
  try{
   const [appointments,customers,employees,products,lots,report]=await Promise.all([
    listAppointments(actor),listCustomers(actor),listEmployees(actor),listProducts(actor),listInventoryLots(actor),
    getSalesReport(actor,monthStart().toISOString(),new Date(Date.now()+1000).toISOString()),
   ])
   setData({appointments,customers,employees,products,lots,revenue:report.netCollectedVnd})
  }catch(e){setError(e instanceof Error?e.message:'Không tải được dữ liệu tổng quan.')}
  finally{setBusy(false)}
 }
 useEffect(()=>{void reload()},[actor.salonId,actor.actorId,actor.deviceId])
 const start=dayStart().getTime(),end=start+86400000
 const today=data.appointments.filter(a=>Date.parse(a.startAt)>=start&&Date.parse(a.startAt)<end&&a.status!=='cancelled'&&a.status!=='no_show').sort((a,b)=>a.startAt.localeCompare(b.startAt))
 const activeEmployees=data.employees.filter(e=>e.status==='active').length
 const stock=data.products.map(p=>({product:p,quantity:data.lots.filter(l=>l.productId===p.id&&l.status==='active'&&(!l.expiresAt||Date.parse(l.expiresAt)>Date.now())).reduce((n,l)=>n+l.quantityRemaining,0)}))
 const lowStock=stock.filter(x=>x.quantity<=x.product.minimumStock)
 return <section className="work-page">
  <div className="work-intro"><div><small>SALON TÓC QUYỀN · OWNER APP</small><h2>Tổng quan hoạt động</h2><p>Số liệu được tổng hợp trực tiếp từ dữ liệu trên thiết bị của salon.</p></div><button className="subtle-button" onClick={()=>void reload()} disabled={busy}><RefreshCw size={14}/> Làm mới</button></div>
  {error&&<p className="form-error" role="alert">{error}</p>}
  <div className="cards dashboard-metrics">
   <article className="card"><CalendarDays/><small>LỊCH HẸN HÔM NAY</small><h3>{today.length}</h3><p>Lịch không bị hủy hoặc bỏ hẹn.</p></article>
   <article className="card"><Users/><small>KHÁCH HÀNG</small><h3>{data.customers.length}</h3><p>Hồ sơ đang hoạt động.</p></article>
   <article className="card"><Scissors/><small>NHÂN VIÊN ĐANG LÀM</small><h3>{activeEmployees}</h3><p>Tổng {data.employees.length} hồ sơ nhân viên.</p></article>
   <article className="card"><Package/><small>SẢN PHẨM / VẬT TƯ</small><h3>{data.products.length}</h3><p>{lowStock.length} mặt hàng cần kiểm tra tồn.</p></article>
   <article className="card"><Wallet/><small>THU RÒNG THÁNG NÀY</small><h3>{formatVnd(data.revenue)}</h3><p>Tiền đã thu trừ hoàn tiền và chi phí.</p></article>
  </div>
  <div className="work-form"><h3>Lịch hẹn hôm nay</h3>{today.length?today.slice(0,8).map(a=><article className="record" key={a.id}><div><b>{new Date(a.startAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})} · {a.customerNameSnapshot}</b><p>{a.customerPhoneSnapshot||'Không có số điện thoại'} · {a.status}</p></div></article>):<p className="empty-state">{busy?'Đang tải dữ liệu…':'Chưa có lịch hẹn hôm nay.'}</p>}</div>
  <div className="work-form"><h3>Cảnh báo tồn kho</h3>{lowStock.length?lowStock.map(({product,quantity})=><article className="record" key={product.id}><div><b>{product.name}</b><p>Tồn khả dụng: {quantity} {product.unit} · Mức tối thiểu: {product.minimumStock}</p></div></article>):<p className="empty-state">{busy?'Đang kiểm tra tồn kho…':'Không có mặt hàng dưới ngưỡng tồn tối thiểu.'}</p>}</div>
  <div className="notice"><div><b>Lưu ý về dữ liệu</b><p>Dashboard sử dụng dữ liệu IndexedDB của salon hiện tại. Do chưa có đồng bộ P2P/cloud dữ liệu nghiệp vụ, số liệu chỉ phản ánh thiết bị đang mở.</p></div></div>
 </section>
}
