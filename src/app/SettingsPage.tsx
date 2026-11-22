import { useEffect, useState } from 'react'
import { useOwnerContext } from '../auth/OwnerContext'
import { clearDemoData, getDemoDataCounts, seedDemoData, type DemoCounts } from '../db/demo-data'

export function SettingsPage(){
 const actor=useOwnerContext()
 const [counts,setCounts]=useState<DemoCounts>({})
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [error,setError]=useState('')
 async function reload(){setCounts(await getDemoDataCounts(actor.salonId))}
 useEffect(()=>{void reload().catch(e=>setError(e instanceof Error?e.message:'Không đọc được trạng thái dữ liệu mẫu.'))},[actor])
 const total=Object.values(counts).reduce((sum,count)=>sum+count,0)
 async function seed(){setBusy(true);setError('');setMessage('');try{const result=await seedDemoData(actor);await reload();setMessage(result.created?'Đã nạp bộ dữ liệu mẫu.':'Dữ liệu mẫu đã tồn tại, không tạo trùng.')}catch(e){setError(e instanceof Error?e.message:'Không thể nạp dữ liệu mẫu.')}finally{setBusy(false)}}
 async function clear(){if(!window.confirm('Chỉ xóa các bản ghi có ID được đánh dấu dữ liệu mẫu của salon này. Dữ liệu thật sẽ được giữ nguyên. Bạn có chắc chắn?'))return;setBusy(true);setError('');setMessage('');try{const removed=await clearDemoData(actor);await reload();setMessage('Đã xóa dữ liệu mẫu: '+Object.values(removed).reduce((a,b)=>a+b,0)+' bản ghi.')}catch(e){setError(e instanceof Error?e.message:'Không thể xóa dữ liệu mẫu.')}finally{setBusy(false)}}
 return <section className="work-page"><div className="work-intro"><div><small>OWNER · THIẾT LẬP SALON</small><h2>Cài đặt</h2><p>Quản lý dữ liệu mẫu và kiểm tra trạng thái thiết lập trên thiết bị này.</p></div><button className="subtle-button" onClick={()=>void reload()}>Làm mới</button></div>
 <div className="work-form"><h3>Dữ liệu mẫu để thực hành</h3><p className="record-note">Bộ dữ liệu gồm 10 nhân viên, 10 khách hàng, 6 dịch vụ, 8 lịch hẹn, ca làm, hoa hồng, sản phẩm và nhà cung cấp. Tất cả đều gắn với salon hiện tại và có ID riêng bắt đầu bằng demo_.</p><div className="cards"><article className="card"><small>BẢN GHI MẪU TRÊN THIẾT BỊ</small><h3>{total}</h3><p>Chỉ đếm dữ liệu mẫu thuộc salon hiện tại.</p></article><article className="card"><small>NHÂN VIÊN MẪU</small><h3>{counts.employees??0} / 10</h3><p>Hồ sơ nhân sự minh họa.</p></article></div><div className="form-actions"><button className="primary-button" disabled={busy||total>0} onClick={()=>void seed()}>{busy?'Đang xử lý…':'Nạp dữ liệu mẫu'}</button><button className="subtle-button" disabled={busy||total===0} onClick={()=>void clear()}>Xóa dữ liệu mẫu</button></div><p className="record-note">Nạp mẫu không ghi đè dữ liệu đang có. Xóa mẫu chỉ nhắm tới ID demo_ thuộc salon hiện tại; nếu dữ liệu mẫu đã được hóa đơn/lịch hẹn/ca làm thật sử dụng, hệ thống sẽ chặn xóa để bảo toàn lịch sử.</p>{message&&<p className="success-message" role="status">{message}</p>}{error&&<p className="form-error" role="alert">{error}</p>}</div>
 <div className="work-form"><h3>Thông tin không gian</h3><div className="record"><div><b>Mã salon</b><p>{actor.salonId}</p></div></div><div className="notice"><div><b>Lưu trữ và đồng bộ</b><p>Dữ liệu nghiệp vụ hiện lưu cục bộ trên trình duyệt/thiết bị này bằng IndexedDB. P2P/WebRTC và đồng bộ nhiều thiết bị chưa được triển khai; hãy tạo backup mã hóa định kỳ.</p></div></div></div></section>
}
