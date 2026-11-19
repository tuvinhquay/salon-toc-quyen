import { useState, type FormEvent } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { appCheck, firebaseApp } from '../lib/firebase'

type AssistantRequest={question:string;context?:string}
type AssistantResponse={answer:string;model:string}

export function AssistantPage(){
 const [question,setQuestion]=useState('')
 const [context,setContext]=useState('')
 const [answer,setAnswer]=useState('')
 const [model,setModel]=useState('')
 const [error,setError]=useState<string|null>(null)
 const [busy,setBusy]=useState(false)
 async function submit(e:FormEvent){
  e.preventDefault()
  if(!firebaseApp){setError('Firebase chưa được cấu hình.');return}
  if(!appCheck){setError('Chưa cấu hình Firebase App Check với reCAPTCHA Enterprise. Trợ lý AI đang khóa an toàn.');return}
  setBusy(true);setError(null);setAnswer('')
  try{
   const functions=getFunctions(firebaseApp,'asia-southeast1')
   const call=httpsCallable<AssistantRequest,AssistantResponse>(functions,'salonAssistant')
   const result=await call({question,context})
   setAnswer(result.data.answer);setModel(result.data.model)
  }catch(cause){
   setError(cause instanceof Error?cause.message:'Không gọi được trợ lý AI. Kiểm tra đăng nhập, App Check và cấu hình Cloud Functions.')
  }finally{setBusy(false)}
 }
 return <section className="work-page"><div className="work-intro"><div><small>P12 · GEMINI SERVER-SIDE</small><h2>Trợ lý AI salon</h2><p>Trợ lý vận hành dùng Gemini qua Cloud Functions, không đưa API key xuống trình duyệt.</p></div></div><div className="notice"><div><b>Quyền riêng tư và giới hạn truy cập</b><p>Trợ lý chỉ nhận câu hỏi và ngữ cảnh bạn chủ động nhập. Không tự đọc hồ sơ khách hàng, hóa đơn hay kho. Máy chủ kiểm tra Owner membership, App Check và giới hạn số lượt gọi.</p></div></div>{!appCheck&&<p className="form-error">App Check chưa sẵn sàng. Cần tạo reCAPTCHA Enterprise site key trong Firebase Console và đặt VITE_RECAPTCHA_ENTERPRISE_SITE_KEY trong .env.local.</p>}<form className="work-form" onSubmit={e=>void submit(e)}><label className="field"><span>Câu hỏi</span><textarea required minLength={1} maxLength={5000} rows={4} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ví dụ: Gợi ý quy trình tiếp nhận khách đặt lịch nhuộm tóc."/></label><label className="field"><span>Ngữ cảnh bổ sung (tùy chọn, tối đa 4.000 ký tự)</span><textarea maxLength={4000} rows={3} value={context} onChange={e=>setContext(e.target.value)} placeholder="Chỉ nhập thông tin không nhạy cảm cần thiết. Không nhập mật khẩu, API key hoặc thông tin thanh toán."/></label><button className="primary-button" disabled={busy||!appCheck||!firebaseApp}>{busy?'Đang hỏi Gemini…':'Gửi câu hỏi'}</button></form>{error&&<p className="form-error" role="alert">{error}</p>}{answer&&<article className="work-form"><small>TRẢ LỜI TỪ {model.toUpperCase()}</small><div className="assistant-answer">{answer}</div></article>}</section>
}
