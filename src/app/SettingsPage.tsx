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
 async function reload(){const [nextCounts,nextGroups]=await Promise.all([getDemoDataCounts(actor.salonId),listCustomerGroups(actor)]);setCounts(nextCounts);setGroups(nextGroups)}
 useEffect(()=>{void reload().catch(e=>setError(e instanceof Error?e.message:'Không đọc được trạng thái thiết lập.'))},[actor])
 const total=Object.values(counts).reduce((sum,count)=>sum+count,0)
 function resetGroup(){setEditingGroup(null);setGroupName('');setGroupDescription('');setGroupPeriod('month')}
 async function saveGroup(event:FormEvent){event.preventDefault();setBusy(true);setError('');setMessage('');try{await saveCustomerGroup(actor,{name:groupName,description:groupDescription,period:groupPeriod,active:true},editingGroup??undefined);await reload();resetGroup();setMessage('Đã lưu nhóm khách hàng.')}catch(e){setError(e instanceof Error?e.message:'Không lưu được nhóm khách hàng.')}finally{setBusy(false)}}
 async function archiveGroup(group:CustomerGroup){if(!window.confirm('Lưu trữ nhóm “'+group.name+'”? Nhóm đang được gắn với khách hàng sẽ không thể lưu trữ cho tới khi chuyển các khách đó sang nhóm khác.'))return;setBusy(true);setError('');setMessage('');try{await archiveCustomerGroup(actor,group.id);await reload();if(editingGroup===group.id)resetGroup();setMessage('Đã lưu trữ nhóm khách hàng.')}catch(e){setError(e instanceof Error?e.message:'Không lưu trữ được nhóm.')}finally{setBusy(false)}}
 async function seed(){setBusy(true);setError('');setMessage('');try{const result=await seedDemoData(actor);await reload();setMessage(result.created?'Đã nạp bộ dữ liệu mẫu.':'Dữ liệu mẫu đã tồn tại, không tạo trùng.')}catch(e){setError(e instanceof Error?e.message:'Không thể nạp dữ liệu mẫu.')}finally{setBusy(false)}}
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
  <div className="work-form"><h3>Dữ liệu mẫu để thực hành</h3><p className="record-note">Bộ dữ liệu gồm 10 nhân viên, 10 khách hàng, 6 dịch vụ, 8 lịch hẹn, ca làm, hoa hồng, sản phẩm và nhà cung cấp. Tất cả đều gắn với salon hiện tại và có ID riêng bắt đầu bằng demo_.</p><div className="cards"><article className="card"><small>BẢN GHI MẪU TRÊN THIẾT BỊ</small><h3>{total}</h3><p>Chỉ đếm dữ liệu mẫu thuộc salon hiện tại.</p></article><article className="card"><small>NHÂN VIÊN MẪU</small><h3>{counts.employees??0} / 10</h3><p>Hồ sơ nhân sự minh họa.</p></article></div><div className="form-actions"><button className="primary-button" disabled={busy||total>0} onClick={()=>void seed()}>{busy?'Đang xử lý…':'Nạp dữ liệu mẫu'}</button><button className="subtle-button" disabled={busy||total===0} onClick={()=>void clear()}>Xóa dữ liệu mẫu</button></div><p className="record-note">Nạp mẫu không ghi đè dữ liệu đang có. Xóa mẫu chỉ nhắm tới ID demo_ thuộc salon hiện tại; không xóa dữ liệu thật.</p></div>
  <div className="work-form"><h3>Thông tin không gian</h3><div className="record"><div><b>Mã salon</b><p>{actor.salonId}</p></div></div><div className="notice"><div><b>Lưu trữ và đồng bộ</b><p>Dữ liệu nghiệp vụ hiện lưu cục bộ trên trình duyệt/thiết bị này bằng IndexedDB. P2P/WebRTC và đồng bộ nhiều thiết bị chưa được triển khai; hãy tạo backup mã hóa định kỳ.</p></div></div></div>
  {message&&<p className="success-message" role="status">{message}</p>}{error&&<p className="form-error" role="alert">{error}</p>}
 </section>
}
