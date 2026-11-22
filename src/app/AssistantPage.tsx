import { useState, type FormEvent } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { appCheck, firebaseApp } from '../lib/firebase'
import { useOwnerContext } from '../auth/OwnerContext'
import { buildOwnerAssistantContext } from './assistant-context'

type AssistantRequest={question:string;context?:string}
type AssistantResponse={answer:string;model:string}

export function AssistantPage(){
 const actor=useOwnerContext()
 const [question,setQuestion]=useState('')
 const [context,setContext]=useState('')
 const [answer,setAnswer]=useState('')
 const [model,setModel]=useState('')
 const [error,setError]=useState<string|null>(null)
 const [busy,setBusy]=useState(false)
 async function submit(e:FormEvent){
  e.preventDefault()
  if(!firebaseApp){setError('Firebase chưa được cấu hình.');return}
  if(!appCheck){setError('Trợ lý cần Firebase App Check. Hãy cấu hình reCAPTCHA Enterprise site key trong .env.local và triển khai App Check trước khi gửi câu hỏi.');return}
  setBusy(true);setError(null);setAnswer('')
  try{
   const systemSnapshot=await buildOwnerAssistantContext(actor.salonId)
   const combinedContext=[systemSnapshot,context.trim()?('GHI CHÚ BỔ SUNG DO CHỦ TIỆM CUNG CẤP:\n'+context.trim()):''].filter(Boolean).join('\n\n')
   const functions=getFunctions(firebaseApp,'asia-southeast1')
   const call=httpsCallable<AssistantRequest,AssistantResponse>(functions,'salonAssistant')
   const result=await call({question,context:combinedContext})
   setAnswer(result.data.answer);setModel(result.data.model)
  }catch(cause){
   setError(cause instanceof Error?cause.message:'Không gọi được trợ lý AI. Kiểm tra đăng nhập, App Check và cấu hình Cloud Functions.')
  }finally{setBusy(false)}
 }
 return <section className="work-page"><div className="work-intro"><div><small>TRỢ LÝ ĐỒNG HÀNH TÓC QUYỀN</small><h2>Trợ lý AI salon</h2><p>Hỏi tự nhiên về vận hành, lịch hẹn, nhân sự, kho và tình hình tài chính của salon.</p></div></div>
 <div className="assistant-welcome"><div className="assistant-mini-robot"><span/><i/><i/><b/></div><div><strong>Xin chào! Mình có thể giúp gì cho salon hôm nay?</strong><p>Mình tự đọc bản tóm tắt dữ liệu trên thiết bị hiện tại để phân tích cùng bạn. Bạn không cần sao chép số liệu thủ công.</p></div></div>
 <div className="notice"><div><b>Quyền truy cập Owner đang hoạt động</b><p>AI được đọc số liệu tổng hợp về khách hàng, lịch hẹn, dịch vụ, nhân sự, tồn kho, hóa đơn, thu/hoàn và chi phí của salon hiện tại. Dữ liệu được giới hạn theo salonId đã xác minh. Không gửi tên, số điện thoại, email, ghi chú riêng, công thức tóc hoặc mã thanh toán.</p><p>Ở phiên bản này AI chỉ phân tích và đề xuất, chưa tự ghi/sửa/xóa dữ liệu hoặc thực hiện giao dịch. Mọi thao tác nghiệp vụ vẫn cần người có quyền thực hiện trong module tương ứng.</p></div></div>
 {!appCheck&&<p className="form-error">Chưa cấu hình App Check: cần reCAPTCHA Enterprise site key để gọi AI an toàn. Giao diện và phần đọc dữ liệu cục bộ vẫn hoạt động, nhưng Gemini chưa thể nhận yêu cầu cho đến khi cấu hình xong.</p>}
 <form className="work-form" onSubmit={e=>void submit(e)}><label className="field"><span>Bạn muốn trợ lý phân tích điều gì?</span><textarea required minLength={1} maxLength={5000} rows={4} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ví dụ: Phân tích tình hình salon tháng này, chỉ ra lịch hẹn cần chú ý và mặt hàng sắp thiếu."/></label><label className="field"><span>Thông tin bổ sung (không bắt buộc)</span><textarea maxLength={2000} rows={2} value={context} onChange={e=>setContext(e.target.value)} placeholder="Có thể bổ sung mục tiêu hoặc hoàn cảnh kinh doanh. Không nhập mật khẩu hay khóa API."/></label><button className="primary-button" disabled={busy||!appCheck||!firebaseApp}>{busy?'Đang đọc số liệu và phân tích…':'Phân tích cùng trợ lý AI'}</button></form>
 {error&&<p className="form-error" role="alert">{error}</p>}{answer&&<article className="work-form"><small>PHÂN TÍCH TỪ {model.toUpperCase()}</small><div className="assistant-answer">{answer}</div></article>}</section>
}
