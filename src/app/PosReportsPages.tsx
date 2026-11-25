import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useOwnerContext } from '../auth/OwnerContext'
import { addPayment, closeCashSession, createExpense, createInvoice, getSalesReport, listCashSessions, listCustomers, listEmployees, listExpenses, listInvoices, listPayments, listProducts, listRefunds, listServices, openCashSession, refundPayment, saveTaxPolicy } from '../db/repositories'
import type { CashSession, Customer, Employee, Expense, Invoice, Payment, Product, Refund, Service } from '../db/types'
import { formatVnd } from '../lib/format'
function Field({label,children}:{label:string;children:ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
function ErrorText({value}:{value:string|null}){return value?<p className="form-error" role="alert">{value}</p>:null}
function localDate(d:Date){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function iso(v:string){return new Date(v).toISOString()}
export function PosPage(){
 const actor=useOwnerContext();const [invoices,setInvoices]=useState<Invoice[]>([]);const [payments,setPayments]=useState<Payment[]>([]);const [refunds,setRefunds]=useState<Refund[]>([]);const [expenses,setExpenses]=useState<Expense[]>([]);const [sessions,setSessions]=useState<CashSession[]>([]);const [customers,setCustomers]=useState<Customer[]>([]);const [employees,setEmployees]=useState<Employee[]>([]);const [services,setServices]=useState<Service[]>([]);const [products,setProducts]=useState<Product[]>([]);const [error,setError]=useState<string|null>(null);const [busy,setBusy]=useState(false)
 const [float,setFloat]=useState('0');const [counted,setCounted]=useState('0')
 const [taxName,setTaxName]=useState('VAT');const [taxRate,setTaxRate]=useState('10');const [inclusive,setInclusive]=useState(false);const [taxFrom,setTaxFrom]=useState(()=>localDate(new Date()))
 const [invoiceNo,setInvoiceNo]=useState(()=> 'HD-'+Date.now());const [customerId,setCustomerId]=useState('');const [lineType,setLineType]=useState<'service'|'product'|'custom'>('service');const [referenceId,setReferenceId]=useState('');const [lineEmployeeId,setLineEmployeeId]=useState('');const [description,setDescription]=useState('');const [qty,setQty]=useState('1');const [unitPrice,setUnitPrice]=useState('0');const [discount,setDiscount]=useState('0')
 const [paymentInvoice,setPaymentInvoice]=useState('');const [paymentMethod,setPaymentMethod]=useState<'cash'|'bank_transfer'|'card'|'other'>('cash');const [paymentAmount,setPaymentAmount]=useState('');const [refundPaymentId,setRefundPaymentId]=useState('');const [refundAmount,setRefundAmount]=useState('');const [refundMethod,setRefundMethod]=useState<'cash'|'bank_transfer'|'card'|'other'>('cash');const [refundReason,setRefundReason]=useState('')
 const [expenseCategory,setExpenseCategory]=useState('Chi phí vận hành');const [expenseAmount,setExpenseAmount]=useState('');const [expenseMethod,setExpenseMethod]=useState<'cash'|'bank_transfer'|'card'|'other'>('cash')
 async function reload(){const r=await Promise.all([listInvoices(actor),listPayments(actor),listRefunds(actor),listExpenses(actor),listCashSessions(actor),listCustomers(actor),listServices(actor),listProducts(actor),listEmployees(actor)]);setInvoices(r[0]);setPayments(r[1]);setRefunds(r[2]);setExpenses(r[3]);setSessions(r[4]);setCustomers(r[5]);setServices(r[6].filter(x=>x.active));setProducts(r[7].filter(x=>x.active));setEmployees(r[8].filter(x=>x.status==='active'));}
 useEffect(()=>{void reload().catch(e=>setError(String(e)))},[actor])
 const openSession=sessions.find(s=>s.status==='open')
 function chooseLine(id:string){setReferenceId(id);if(lineType==='service'){const x=services.find(s=>s.id===id);if(x){setDescription(x.name);setUnitPrice(String(x.priceVnd))}}else if(lineType==='product'){const x=products.find(p=>p.id===id);if(x){setDescription(x.name);setUnitPrice(String(x.salePriceVnd??Number(x.customFields?.['Giá bán mẫu']??0)))}}}
 async function action(fn:()=>Promise<unknown>){setBusy(true);setError(null);try{await fn();await reload()}catch(e){setError(e instanceof Error?e.message:'Thao tác không thành công.')}finally{setBusy(false)}}
 async function saveTax(e:FormEvent){e.preventDefault();await action(async()=>{await saveTaxPolicy(actor,{name:taxName,ratePercent:Number(taxRate),inclusive,effectiveFrom:iso(taxFrom),active:true})})}
 async function issueInvoice(e:FormEvent){e.preventDefault();await action(async()=>{const customer=customers.find(c=>c.id===customerId);const employee=employees.find(item=>item.id===lineEmployeeId);await createInvoice(actor,{invoiceNumber:invoiceNo,customerId:customer?.id??null,customerNameSnapshot:customer?.fullName??'Khách lẻ',customerPhoneSnapshot:customer?.phone??null,issuedAt:new Date().toISOString(),notes:'',lines:[{lineType,referenceId:lineType==='custom'?null:referenceId,description,quantity:Number(qty),unitPriceVnd:Number(unitPrice),discountVnd:Number(discount),employeeId:employee?.id??null}]});setInvoiceNo('HD-'+Date.now());setDescription('');setReferenceId('');setLineEmployeeId('');setQty('1');setUnitPrice('0');setDiscount('0')})}
 async function pay(e:FormEvent){e.preventDefault();await action(async()=>{await addPayment(actor,{invoiceId:paymentInvoice,method:paymentMethod,amountVnd:Number(paymentAmount),paidAt:new Date().toISOString(),reference:''});setPaymentAmount('')})}
 async function refund(e:FormEvent){e.preventDefault();await action(async()=>{await refundPayment(actor,{paymentId:refundPaymentId,amountVnd:Number(refundAmount),method:refundMethod,reason:refundReason,refundedAt:new Date().toISOString()});setRefundAmount('');setRefundReason('')})}
 async function expense(e:FormEvent){e.preventDefault();await action(async()=>{await createExpense(actor,{category:expenseCategory,amountVnd:Number(expenseAmount),method:expenseMethod,paidAt:new Date().toISOString(),notes:''});setExpenseAmount('')})}
 return <section className="work-page"><div className="work-intro"><div><small>P08 · THU NGÂN & HÓA ĐƠN</small><h2>Thu ngân & hóa đơn</h2><p>Phát hành hóa đơn, thanh toán, hoàn tiền, chi phí và đóng ca.</p></div><button className="subtle-button" onClick={()=>void reload()}>Làm mới</button></div><ErrorText value={error}/>
 <div className="work-form"><h3>Ca thu ngân</h3>{openSession?<><p className="record-note">Ca đang mở từ {new Date(openSession.openedAt).toLocaleString('vi-VN')} · Tiền đầu ca {formatVnd(openSession.openingFloatVnd)}</p><form onSubmit={e=>{e.preventDefault();void action(async()=>{await closeCashSession(actor,{cashSessionId:openSession.id,countedCashVnd:Number(counted),closedAt:new Date().toISOString(),notes:''})})}}><div className="form-grid"><Field label="Tiền mặt kiểm đếm (VND)"><input type="number" min="0" step="1" required value={counted} onChange={e=>setCounted(e.target.value)}/></Field></div><button className="primary-button" disabled={busy}>Đóng ca và đối soát</button></form></>:<form onSubmit={e=>{e.preventDefault();void action(async()=>{await openCashSession(actor,{openingFloatVnd:Number(float),openedAt:new Date().toISOString(),notes:''})})}}><Field label="Tiền đầu ca (VND)"><input type="number" min="0" step="1" required value={float} onChange={e=>setFloat(e.target.value)}/></Field><button className="primary-button" disabled={busy}>Mở ca thu ngân</button></form>}</div>
 <form className="work-form" onSubmit={e=>void saveTax(e)}><h3>Thiết lập thuế áp dụng</h3><div className="form-grid"><Field label="Tên chính sách"><input required value={taxName} onChange={e=>setTaxName(e.target.value)}/></Field><Field label="Thuế suất (%)"><input type="number" min="0" max="100" step="0.01" required value={taxRate} onChange={e=>setTaxRate(e.target.value)}/></Field><Field label="Hiệu lực từ"><input type="datetime-local" required value={taxFrom} onChange={e=>setTaxFrom(e.target.value)}/></Field><Field label="Cách tính"><select value={inclusive?'inclusive':'exclusive'} onChange={e=>setInclusive(e.target.value==='inclusive')}><option value="exclusive">Cộng thuế vào giá</option><option value="inclusive">Giá đã gồm thuế</option></select></Field></div><button className="primary-button" disabled={busy}>Lưu chính sách thuế</button><small>Chính sách mới áp dụng cho hóa đơn phát hành từ thời điểm hiệu lực.</small></form>
 <form className="work-form" onSubmit={e=>void issueInvoice(e)}><h3>Lập hóa đơn</h3><div className="form-grid"><Field label="Số hóa đơn"><input required value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)}/></Field><Field label="Khách hàng"><select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Khách lẻ</option>{customers.map(c=><option key={c.id} value={c.id}>{c.fullName}</option>)}</select></Field><Field label="Loại dòng hàng"><select value={lineType} onChange={e=>{setLineType(e.target.value as typeof lineType);setReferenceId('');setDescription('');setUnitPrice('0')}}><option value="service">Dịch vụ</option><option value="product">Sản phẩm</option><option value="custom">Khác</option></select></Field>{lineType!=='custom'&&<Field label="Chọn mặt hàng"><select required value={referenceId} onChange={e=>chooseLine(e.target.value)}><option value="">Chọn</option>{(lineType==='service'?services:products).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>}<Field label="Nhân viên thực hiện / bán"><select value={lineEmployeeId} onChange={e=>setLineEmployeeId(e.target.value)}><option value="">Chưa gán nhân viên</option>{employees.map(employee=><option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select></Field><Field label="Mô tả"><input required value={description} onChange={e=>setDescription(e.target.value)}/></Field><Field label="Số lượng"><input type="number" min="0.01" step="0.01" required value={qty} onChange={e=>setQty(e.target.value)}/></Field><Field label="Đơn giá (VND)"><input type="number" min="0" step="1" required value={unitPrice} onChange={e=>setUnitPrice(e.target.value)}/></Field><Field label="Chiết khấu (VND)"><input type="number" min="0" step="1" required value={discount} onChange={e=>setDiscount(e.target.value)}/></Field></div><button className="primary-button" disabled={busy}>Phát hành hóa đơn</button><small>Sản phẩm sẽ trừ tồn theo FEFO trong cùng giao dịch. Không đủ tồn sẽ hủy toàn bộ phát hành.</small></form>
 <form className="work-form" onSubmit={e=>void pay(e)}><h3>Ghi nhận thanh toán</h3><div className="form-grid"><Field label="Hóa đơn còn dư"><select required value={paymentInvoice} onChange={e=>setPaymentInvoice(e.target.value)}><option value="">Chọn hóa đơn</option>{invoices.filter(i=>i.status==='issued'||i.status==='partially_paid').map(i=><option key={i.id} value={i.id}>{i.invoiceNumber} · còn {formatVnd(i.totalVnd-i.amountPaidVnd)}</option>)}</select></Field><Field label="Phương thức"><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as typeof paymentMethod)}><option value="cash">Tiền mặt</option><option value="bank_transfer">Chuyển khoản</option><option value="card">Thẻ</option><option value="other">Khác</option></select></Field><Field label="Số tiền (VND)"><input type="number" min="1" step="1" required value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)}/></Field></div><button className="primary-button" disabled={busy||!paymentInvoice||(paymentMethod==='cash'&&!openSession)}>Ghi nhận thanh toán</button></form>
 <form className="work-form" onSubmit={e=>void refund(e)}><h3>Hoàn tiền</h3><div className="form-grid"><Field label="Khoản thanh toán"><select required value={refundPaymentId} onChange={e=>setRefundPaymentId(e.target.value)}><option value="">Chọn khoản đã thu</option>{payments.filter(p=>p.status!=='refunded'&&p.status!=='void').map(p=><option key={p.id} value={p.id}>{invoices.find(i=>i.id===p.invoiceId)?.invoiceNumber??'Hóa đơn'} · {formatVnd(p.amountVnd)}</option>)}</select></Field><Field label="Số tiền hoàn (VND)"><input type="number" min="1" step="1" required value={refundAmount} onChange={e=>setRefundAmount(e.target.value)}/></Field><Field label="Phương thức hoàn"><select value={refundMethod} onChange={e=>setRefundMethod(e.target.value as typeof refundMethod)}><option value="cash">Tiền mặt</option><option value="bank_transfer">Chuyển khoản</option><option value="card">Thẻ</option><option value="other">Khác</option></select></Field><Field label="Lý do"><input required value={refundReason} onChange={e=>setRefundReason(e.target.value)}/></Field></div><button className="primary-button" disabled={busy||!refundPaymentId||(refundMethod==='cash'&&!openSession)}>Xác nhận hoàn tiền</button></form>
 <form className="work-form" onSubmit={e=>void expense(e)}><h3>Ghi chi phí</h3><div className="form-grid"><Field label="Khoản chi"><input required value={expenseCategory} onChange={e=>setExpenseCategory(e.target.value)}/></Field><Field label="Số tiền (VND)"><input type="number" min="1" step="1" required value={expenseAmount} onChange={e=>setExpenseAmount(e.target.value)}/></Field><Field label="Phương thức"><select value={expenseMethod} onChange={e=>setExpenseMethod(e.target.value as typeof expenseMethod)}><option value="cash">Tiền mặt</option><option value="bank_transfer">Chuyển khoản</option><option value="card">Thẻ</option><option value="other">Khác</option></select></Field></div><button className="primary-button" disabled={busy||(expenseMethod==='cash'&&!openSession)}>Lưu chi phí</button></form>
 <div className="record-list"><h3>Hóa đơn gần đây</h3>{invoices.slice().reverse().map(i=><article className="record" key={i.id}><div><b>{i.invoiceNumber} · {i.customerNameSnapshot}</b><p>{new Date(i.issuedAt).toLocaleString('vi-VN')} · {i.status}</p><small>{formatVnd(i.totalVnd)} · Đã thu {formatVnd(i.amountPaidVnd)}</small></div></article>)}{invoices.length===0&&<p className="empty-state">Chưa có hóa đơn.</p>}</div>
 <div className="record-list"><h3>Giao dịch và chi phí</h3>{payments.slice().reverse().slice(0,10).map(p=><article className="record" key={p.id}><div><b>Thu {formatVnd(p.amountVnd)}</b><p>{p.method} · {new Date(p.paidAt).toLocaleString('vi-VN')}</p></div></article>)}{refunds.slice().reverse().slice(0,10).map(r=><article className="record" key={r.id}><div><b>Hoàn {formatVnd(r.amountVnd)}</b><p>{r.reason}</p></div></article>)}{expenses.slice().reverse().slice(0,10).map(x=><article className="record" key={x.id}><div><b>Chi {formatVnd(x.amountVnd)}</b><p>{x.category}</p></div></article>)}</div>
 </section>
}
export type RevenueBucket = { label: string; collected: number; refunded: number; expenses: number }
export function buildRevenueBuckets(payments: Payment[], expenses: Expense[], refunds: Refund[], startAt: string, endAt: string): RevenueBucket[] {
 const startDate = new Date(startAt)
 const endDate = new Date(endAt)
 if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) return []
 const monthMode = endDate.getTime() - startDate.getTime() > 45 * 86400000
 const keyOf = (value: string) => {
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return ''
  const year = d.getFullYear(), month = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0')
  return monthMode ? year+'-'+month : year+'-'+month+'-'+day
 }
 const buckets = new Map<string, RevenueBucket>()
 const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), monthMode ? 1 : startDate.getDate())
 const endIncludesPartialPeriod = endDate.getDate() > 1 || endDate.getHours() > 0 || endDate.getMinutes() > 0 || endDate.getSeconds() > 0
 const endCursor = monthMode ? new Date(endDate.getFullYear(), endDate.getMonth() + (endIncludesPartialPeriod ? 1 : 0), 1) : new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + (endDate.getHours() > 0 || endDate.getMinutes() > 0 || endDate.getSeconds() > 0 ? 1 : 0))
 for (let guard=0; cursor < endCursor && guard<400; guard++) {
  const key = keyOf(cursor.toISOString())
  const label = monthMode ? cursor.toLocaleDateString('vi-VN',{month:'short',year:'2-digit'}) : cursor.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})
  buckets.set(key,{label,collected:0,refunded:0,expenses:0})
  if (monthMode) cursor.setMonth(cursor.getMonth()+1); else cursor.setDate(cursor.getDate()+1)
 }
 for (const row of payments) { const key=keyOf(row.paidAt); const bucket=buckets.get(key); if(bucket&&row.status!=='void') bucket.collected+=row.amountVnd }
 for (const row of refunds) { const key=keyOf(row.refundedAt); const bucket=buckets.get(key); if(bucket) bucket.refunded+=row.amountVnd }
 for (const row of expenses) { const key=keyOf(row.paidAt); const bucket=buckets.get(key); if(bucket) bucket.expenses+=row.amountVnd }
 return [...buckets.values()]
}
export function ReportsPage(){
 const actor=useOwnerContext()
 const now=new Date()
 const startDefault=new Date(now.getFullYear(),now.getMonth(),now.getDate())
 const endDefault=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)
 const [start,setStart]=useState(()=>localDate(startDefault))
 const [end,setEnd]=useState(()=>localDate(endDefault))
 const [report,setReport]=useState<{invoiceCount:number;grossSalesVnd:number;collectedVnd:number;refundedVnd:number;expensesVnd:number;netCollectedVnd:number}|null>(null)
 const [buckets,setBuckets]=useState<RevenueBucket[]>([])
 const [error,setError]=useState<string|null>(null)
 const [busy,setBusy]=useState(false)
 function setPreset(period:'today'|'month'|'quarter'|'year'){
  const current=new Date()
  let from:Date,to:Date
  if(period==='today'){from=new Date(current.getFullYear(),current.getMonth(),current.getDate());to=new Date(current.getFullYear(),current.getMonth(),current.getDate()+1)}
  else if(period==='month'){from=new Date(current.getFullYear(),current.getMonth(),1);to=new Date(current.getFullYear(),current.getMonth()+1,1)}
  else if(period==='quarter'){const first=Math.floor(current.getMonth()/3)*3;from=new Date(current.getFullYear(),first,1);to=new Date(current.getFullYear(),first+3,1)}
  else{from=new Date(current.getFullYear(),0,1);to=new Date(current.getFullYear()+1,0,1)}
  setStart(localDate(from));setEnd(localDate(to))
 }
 async function load(e?:FormEvent){
  e?.preventDefault();setBusy(true);setError(null)
  try{
   const [summary,paymentRows,expenseRows,refundRows]=await Promise.all([getSalesReport(actor,iso(start),iso(end)),listPayments(actor),listExpenses(actor),listRefunds(actor)])
   setReport(summary)
   setBuckets(buildRevenueBuckets(paymentRows.filter(row=>row.paidAt>=iso(start)&&row.paidAt<iso(end)),expenseRows.filter(row=>row.paidAt>=iso(start)&&row.paidAt<iso(end)),refundRows.filter(row=>row.refundedAt>=iso(start)&&row.refundedAt<iso(end)),iso(start),iso(end)))
  }catch(e){setError(e instanceof Error?e.message:'Không tải được báo cáo.')}finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[actor])
 const maxValue=Math.max(1,...buckets.flatMap(row=>[row.collected,row.refunded,row.expenses]))
 return <section className="work-page">
  <div className="work-intro"><div><small>P09 · BÁO CÁO</small><h2>Báo cáo hoạt động</h2><p>Tổng hợp từ hóa đơn, thanh toán, hoàn tiền và chi phí đã ghi nhận.</p></div></div>
  <div className="report-presets"><span>Xem nhanh:</span><button type="button" className="subtle-button" onClick={()=>setPreset('today')}>Hôm nay</button><button type="button" className="subtle-button" onClick={()=>setPreset('month')}>Tháng này</button><button type="button" className="subtle-button" onClick={()=>setPreset('quarter')}>Quý này</button><button type="button" className="subtle-button" onClick={()=>setPreset('year')}>Năm nay</button></div>
  <form className="work-form" onSubmit={e=>void load(e)}>
   <div className="form-grid"><Field label="Từ ngày"><input type="datetime-local" required value={start} onChange={e=>setStart(e.target.value)}/></Field><Field label="Đến ngày"><input type="datetime-local" required value={end} onChange={e=>setEnd(e.target.value)}/></Field></div>
   <button className="primary-button" disabled={busy}>{busy?'Đang tổng hợp…':'Xem báo cáo'}</button><ErrorText value={error}/>
  </form>
  {report&&<>
   <div className="cards">
    <article className="card"><small>SỐ HÓA ĐƠN</small><h3>{report.invoiceCount}</h3></article>
    <article className="card"><small>DOANH SỐ PHÁT HÀNH</small><h3>{formatVnd(report.grossSalesVnd)}</h3></article>
    <article className="card"><small>ĐÃ THU</small><h3>{formatVnd(report.collectedVnd)}</h3></article>
    <article className="card"><small>ĐÃ HOÀN</small><h3>{formatVnd(report.refundedVnd)}</h3></article>
    <article className="card"><small>CHI PHÍ</small><h3>{formatVnd(report.expensesVnd)}</h3></article>
    <article className="card"><small>THU RÒNG</small><h3>{formatVnd(report.netCollectedVnd)}</h3></article>
   </div>
   <section className="work-form revenue-chart">
    <div className="list-heading"><div><h3>Biểu đồ thu – chi</h3><p className="record-note">Theo ngày khi khoảng xem không quá 45 ngày; theo tháng khi dài hơn.</p></div></div>
    <div className="revenue-legend"><span><i className="legend-collected"/> Tiền đã thu</span><span><i className="legend-refunded"/> Hoàn tiền</span><span><i className="legend-expense"/> Chi phí</span></div>
    {buckets.length===0?<p className="empty-state">Chưa có dữ liệu trong khoảng thời gian này.</p>:<div className="revenue-bars" role="img" aria-label="Biểu đồ tiền đã thu và chi phí theo thời gian">
     {buckets.map((bucket,index)=><div className="revenue-bar-group" key={bucket.label+'-'+index}>
      <div className="revenue-bar-pair">
       <div className="revenue-bar collected" title={'Đã thu '+formatVnd(bucket.collected)} style={{height:Math.max(bucket.collected>0?3:0,bucket.collected/maxValue*100)+'%'}}/>
       <div className="revenue-bar refunded" title={'Hoàn tiền '+formatVnd(bucket.refunded)} style={{height:Math.max(bucket.refunded>0?3:0,bucket.refunded/maxValue*100)+'%'}}/><div className="revenue-bar expense" title={'Chi phí '+formatVnd(bucket.expenses)} style={{height:Math.max(bucket.expenses>0?3:0,bucket.expenses/maxValue*100)+'%'}}/>
      </div><small>{bucket.label}</small>
     </div>)}
    </div>}
    <div className="revenue-chart-foot"><span>Đã thu: <b>{formatVnd(report.collectedVnd)}</b></span><span>Hoàn tiền: <b>{formatVnd(report.refundedVnd)}</b></span><span>Chi phí: <b>{formatVnd(report.expensesVnd)}</b></span></div>
   </section>
  </>}
 </section>
}