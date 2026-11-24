import { useEffect, useState, type FormEvent } from 'react'
import { useOwnerContext } from '../auth/OwnerContext'
import { archiveCustomerGroup, listCustomerGroups, saveCustomerGroup } from '../db/repositories'
import type { CustomerGroup } from '../db/types'
import { clearDemoData, getDemoDataCounts, seedDemoData, type DemoCounts } from '../db/demo-data'

export function SettingsPage(){
 const actor=useOwnerContext()
 const [counts,setCounts]=useState<DemoCounts>({})
 const [groups,setGroups]=useState<CustomerGroup[]>([])
 const [groupName,setGroupName]=useState('')
 const [groupDescription,setGroupDescription]=useState('')
 const [groupPeriod,setGroupPeriod]=useState<'month'|'quarter'|'custom'>('month')
 const [editingGroup,setEditingGroup]=useState<string|null>(null)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [error,setError]=useState('')
 const [datasetRange,setDatasetRange]=useState('')
 async function reload(){const [nextCounts,nextGroups]=await Promise.all([getDemoDataCounts(actor.salonId),listCustomerGroups(actor)]);setCounts(nextCounts);setGroups(nextGroups)}
 useEffect(()=>{void reload().catch(e=>setError(e instanceof Error?e.message:'Không đọc được trạng thái thiết lập.'))},[actor])
 const total=Object.values(counts).reduce((sum,count)=>sum+count,0)
 function resetGroup(){setEditingGroup(null);setGroupName('');setGroupDescription('');setGroupPeriod('month')}
 async function saveGroup(event:FormEvent){event.preventDefault();setBusy(true);setError('');setMessage('');try{await saveCustomerGroup(actor,{name:groupName,description:groupDescription,period:groupPeriod,active:true},editingGroup??undefined);await reload();resetGroup();setMessage('Đã lưu nhóm khách hàng.')}catch(e){setError(e instanceof Error?e.message:'Không lưu được nhóm khách hàng.')}finally{setBusy(false)}}
 async function archiveGroup(group:CustomerGroup){if(!window.confirm('Lưu trữ nhóm “'+group.name+'”? Nhóm đang được gắn với khách hàng sẽ không thể lưu trữ cho tới khi chuyển các khách đó sang nhóm khác.'))return;setBusy(true);setError('');setMessage('');try{await archiveCustomerGroup(actor,group.id);await reload();if(editingGroup===group.id)resetGroup();setMessage('Đã lưu trữ nhóm khách hàng.')}catch(e){setError(e instanceof Error?e.message:'Không lưu trữ được nhóm.')}finally{setBusy(false)}}
 async function seed(){if(total>0&&!window.confirm('Thay toàn bộ bộ dữ liệu mô phỏng hiện có bằng dataset 5 tháng mới? Dữ liệu thật không bị xóa; nếu giao dịch thật đang tham chiếu mẫu, thao tác sẽ bị chặn.'))return;setBusy(true);setError('');setMessage('');try{const result=await seedDemoData(actor);await reload();setDatasetRange(new Date(result.startAt).toLocaleDateString('vi-VN')+' – '+new Date(result.endAt).toLocaleDateString('vi-VN'));setMessage('Đã tạo/thay mới bộ mô phỏng kinh doanh 5 tháng.')}catch(e){setError(e instanceof Error?e.message:'Không thể tạo bộ mô phỏng dữ liệu.')}finally{setBusy(false)}}
 async function clear(){if(!window.confirm('Chỉ xóa các bản ghi có ID được đánh dấu dữ liệu mẫu của salon này. Dữ liệu thật sẽ được giữ nguyên. Bạn có chắc chắn?'))return;setBusy(true);setError('');setMessage('');try{const removed=await clearDemoData(actor);await reload();setMessage('Đã xóa dữ liệu mẫu: '+Object.values(removed).reduce((a,b)=>a+b,0)+' bản ghi.')}catch(e){setError(e instanceof Error?e.message:'Không thể xóa dữ liệu mẫu.')}finally{setBusy(false)}}
 return <section className="work-page">
  <div className="work-intro"><div><small>OWNER · THIẾT LẬP SALON</small><h2>Cài đặt</h2><p>Quản lý nhóm khách hàng, dữ liệu mẫu và trạng thái thiết lập trên thiết bị này.</p></div><button className="subtle-button" onClick={()=>void reload()}>Làm mới</button></div>
  <div className="work-form">
   <h3>Nhóm khách hàng tùy chỉnh</h3>
   <p className="record-note">Tạo nhóm theo tháng, quý hoặc mục đích riêng. Nhóm được lưu theo salon hiện tại và có thể gắn vào hồ sơ khách hàng. Xóa nhóm là lưu trữ, không xóa hồ sơ khách.</p>
   <form onSubmit={e=>void saveGroup(e)}>
    <div className="form-grid">
     <label className="field"><span>Tên nhóm</span><input required maxLength={100} value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ví dụ: Khách thường xuyên tháng này"/></label>
     <label className="field"><span>Chu kỳ</span><select value={groupPeriod} onChange={e=>setGroupPeriod(e.target.value as typeof groupPeriod)}><option value="month">Theo tháng</option><option value="quarter">Theo quý</option><option value="custom">Tùy chỉnh</option></select></label>
     <label className="field"><span>Mô tả</span><input maxLength={500} value={groupDescription} onChange={e=>setGroupDescription(e.target.value)} placeholder="Tiêu chí hoặc ghi chú nhóm"/></label>
    </div>
    <div className="form-actions"><button className="primary-button" disabled={busy}>{editingGroup?'Cập nhật nhóm':'Thêm nhóm'}</button>{editingGroup&&<button type="button" className="subtle-button" onClick={resetGroup}>Hủy sửa</button>}</div>
   </form>
   <div className="record-list">{groups.map(group=><article className="record" key={group.id}><div><b>{group.name}</b><p>{group.period==='month'?'Theo tháng':group.period==='quarter'?'Theo quý':'Tùy chỉnh'} · {group.active?'Đang hoạt động':'Đã lưu trữ'}</p><small>{group.description}</small></div><div className="record-actions"><button className="subtle-button" disabled={busy||!group.active} onClick={()=>{setEditingGroup(group.id);setGroupName(group.name);setGroupDescription(group.description);setGroupPeriod(group.period)}}>Sửa</button>{group.active&&<button className="subtle-button" disabled={busy} onClick={()=>void archiveGroup(group)}>Lưu trữ</button>}</div></article>)}{groups.length===0&&<p className="empty-state">Chưa có nhóm khách hàng. Bạn có thể tạo nhóm tháng hoặc quý ở trên.</p>}</div>
  </div>
  <div className="work-form"><h3>Mô phỏng kinh doanh 5 tháng</h3><div className="notice"><div><b>Lưu ý trước khi tạo dữ liệu</b><p>Bộ mô phỏng được lưu trong salon hiện tại và sẽ xuất hiện cùng dữ liệu thật trên Dashboard/báo cáo. Chỉ tạo khi bạn đang ở salon dành riêng cho demo hoặc chấp nhận số liệu báo cáo bị trộn. Dữ liệu thật không bị xóa.</p></div></div><p className="record-note">Thay phần dữ liệu mẫu cũ bằng một bộ dữ liệu liên kết đầy đủ theo 5 tháng gần nhất: khách hàng giả lập trong bối cảnh Ngã Giao / TP.HCM, nhân viên, ca làm, lịch hẹn, dịch vụ, hóa đơn, thu tiền, hoàn tiền, sản phẩm bán lẻ, nhập kho, xuất kho, nhà cung cấp, chi phí và chênh lệch thu ngân. Tất cả bản ghi được đánh dấu ID demo_ thuộc salon hiện tại; không phải dữ liệu khách hàng, chứng từ hay số liệu kinh doanh thật.</p><div className="cards"><article className="card"><small>TỔNG BẢN GHI MÔ PHỎNG</small><h3>{total.toLocaleString('vi-VN')}</h3><p>Chỉ tính dữ liệu demo của salon đang đăng nhập.</p></article><article className="card"><small>KHÁCH HÀNG GIẢ LẬP</small><h3>{counts.customers??0}</h3><p>Hồ sơ, nhóm khách, khu vực và sở thích mẫu.</p></article><article className="card"><small>HÓA ĐƠN 5 THÁNG</small><h3>{counts.invoices??0}</h3><p>Gắn khách, nhân viên, dịch vụ, sản phẩm và thanh toán.</p></article></div>{datasetRange&&<p className="record-note">Khoảng dữ liệu vừa tạo: <b>{datasetRange}</b></p>}<div className="cards"><article className="card"><small>NHÂN SỰ & CA LÀM</small><h3>{counts.employees??0} nhân viên · {counts.workShifts??0} ca</h3><p>Ca hoàn thành và ca hiện tại được phân bố theo lịch.</p></article><article className="card"><small>KHO & CHI PHÍ</small><h3>{counts.products??0} sản phẩm · {counts.expenses??0} khoản chi</h3><p>Có nhập hàng, lô tồn, xuất dùng, giá vốn và chi phí vận hành.</p></article></div><div className="form-actions"><button className="primary-button" disabled={busy} onClick={()=>void seed()}>{busy?'Đang tạo dữ liệu…':'Tạo / thay mới bộ mô phỏng 5 tháng'}</button><button className="subtle-button" disabled={busy||total===0} onClick={()=>void clear()}>Xóa bộ mô phỏng</button></div><p className="record-note">Tạo/thay mới sẽ chỉ xử lý các bản ghi có ID demo_ của salon hiện tại. Nếu giao dịch thật đang tham chiếu dữ liệu demo, ứng dụng sẽ từ chối thay/xóa để giữ lịch sử. Dữ liệu thật không bị ghi đè.</p></div>
  <div className="work-form"><h3>Thông tin không gian</h3><div className="record"><div><b>Mã salon</b><p>{actor.salonId}</p></div></div><div className="notice"><div><b>Lưu trữ và đồng bộ</b><p>Dữ liệu nghiệp vụ hiện lưu cục bộ trên trình duyệt/thiết bị này bằng IndexedDB. P2P/WebRTC và đồng bộ nhiều thiết bị chưa được triển khai; hãy tạo backup mã hóa định kỳ.</p></div></div></div>
  {message&&<p className="success-message" role="status">{message}</p>}{error&&<p className="form-error" role="alert">{error}</p>}
 </section>
}
