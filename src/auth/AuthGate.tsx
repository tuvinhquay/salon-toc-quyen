import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { RouterProvider } from '@tanstack/react-router'
import { firestore } from '../lib/firebase'
import { Chrome, LoaderCircle, ShieldCheck, WifiOff } from 'lucide-react'
import { router } from '../app/router'
import { useAuth } from './AuthProvider'
import { OwnerProvider } from './OwnerContext'
import type { ActorContext } from '../db/types'
import { provisionOwnerSalon } from './owner-onboarding'

function SignInScreen() {
  const { configured, signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function handleSignIn() {
    setBusy(true); setError(null)
    try { await signIn() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Đăng nhập thất bại.') } finally { setBusy(false) }
  }
  return <main className="auth-screen"><section className="auth-card"><div className="auth-mark"><ShieldCheck size={26}/></div><small>SALON MANAGEMENT · OWNER ACCESS</small><h1>TÓC QUYỀN</h1><p>Không gian quản lý riêng dành cho chủ salon. Đăng nhập để tiếp tục.</p>{!configured ? <div className="auth-warning"><WifiOff size={17}/><span>Firebase chưa được cấu hình. Cần bổ sung cấu hình ứng dụng và bật Google Authentication trước khi đăng nhập.</span></div> : <button className="google-signin" onClick={handleSignIn} disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<Chrome size={18} />}{busy?'Đang kết nối…':'Đăng nhập bằng Google'}</button>}{error&&<p className="auth-error" role="alert">{error}</p>}<div className="auth-foot">DỮ LIỆU KINH DOANH ĐƯỢC BẢO VỆ</div></section></main>
}

function friendlyCreateError(cause: unknown) {
  const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : ''
  if (code.includes('unauthenticated')) return 'Phiên đăng nhập đã hết hạn. Hãy đăng xuất và đăng nhập Google lại.'
  if (code.includes('permission-denied')) return 'Chưa thể tạo salon. Có thể Firestore Rules mới chưa được triển khai hoặc tài khoản này đã có hồ sơ salon.'
  if (code.includes('unavailable') || code.includes('deadline-exceeded')) return 'Máy chủ đang tạm thời không phản hồi. Kiểm tra mạng rồi thử lại.'
  if (code.includes('already-exists')) return 'Tài khoản này đã có không gian salon.'
  if (code.includes('invalid-argument')) return 'Tên salon cần có từ 2 đến 80 ký tự.'
  return 'Chưa thể tạo không gian salon. Vui lòng thử lại; dữ liệu hiện tại vẫn được giữ nguyên.'
}

function AccessPending({message,onRetry,onLogOut,onSwitchAccount,retrying,email,uid,canCreateSalon,onCreateSalon}:{message:string;onRetry:()=>void;onLogOut:()=>void;onSwitchAccount:()=>Promise<void>;retrying:boolean;email:string;uid:string;canCreateSalon:boolean;onCreateSalon:(name:string)=>Promise<void>}) {
 const [switching,setSwitching]=useState(false)
 const [actionError,setActionError]=useState<string|null>(null)
 const [salonName,setSalonName]=useState('Salon của tôi')
 const [creatingSalon,setCreatingSalon]=useState(false)
 async function createSalon(){setCreatingSalon(true);setActionError(null);try{await onCreateSalon(salonName.trim())}catch(cause){setActionError(friendlyCreateError(cause))}finally{setCreatingSalon(false)}}
 async function switchGoogleAccount(){
   setSwitching(true);setActionError(null)
   try{await onSwitchAccount()}catch(cause){setActionError(cause instanceof Error?cause.message:'Chưa thể đổi tài khoản Google.')}
   finally{setSwitching(false)}
 }
 return <main className="auth-screen"><section className="auth-card access-card">
   <div className="auth-mark"><ShieldCheck size={25}/></div>
   <small>{canCreateSalon?'CHÀO MỪNG ĐẾN VỚI TÓC QUYỀN':'KIỂM TRA QUYỀN TRUY CẬP'}</small>
   <h1>{canCreateSalon?'Tạo salon của bạn':'Chưa thể truy cập'}</h1>
   <p className="access-description">{canCreateSalon?'Tài khoản Google này chưa có không gian salon. Bạn có thể tạo salon riêng để bắt đầu quản lý.':message}</p>
   {email&&<div className="access-account-chip"><Chrome size={16}/><span>{email}</span></div>}
   {canCreateSalon&&<div className="owner-tenant-setup">
     <label htmlFor="new-salon-name">Tên salon</label>
     <input id="new-salon-name" aria-label="Tên salon mới" maxLength={80} minLength={2} value={salonName} onChange={event=>setSalonName(event.target.value)} placeholder="Ví dụ: Salon Tóc Quyền"/>
     <p>Mỗi tài khoản chủ tiệm có một không gian riêng. Dữ liệu của các salon được tách biệt.</p>
     <button className="google-signin access-primary" onClick={()=>void createSalon()} disabled={creatingSalon||salonName.trim().length<2}>{creatingSalon?<LoaderCircle className="spin" size={18}/>:<ShieldCheck size={18}/>} {creatingSalon?'Đang tạo salon…':'Tạo không gian salon'}</button>
   </div>}
   {actionError&&<p className="auth-error access-action-error" role="alert">{actionError}</p>}
   <div className="access-secondary-actions">
     {canCreateSalon&&<span>HOẶC</span>}
     <button className="google-signin access-secondary" onClick={()=>void switchGoogleAccount()} disabled={retrying||switching}>{switching?<LoaderCircle className="spin" size={17}/>:<Chrome size={17}/>} {switching?'Đang mở tài khoản…':'Đổi tài khoản Google'}</button>
     {!canCreateSalon&&<button className="subtle-button" onClick={onRetry} disabled={retrying}>{retrying?<LoaderCircle className="spin" size={16}/>:<ShieldCheck size={16}/>} Kiểm tra lại quyền</button>}
     <button className="access-logout" onClick={onLogOut} disabled={retrying||switching}>Đăng xuất</button>
   </div>
   <details className="access-diagnostics"><summary>Thông tin kỹ thuật</summary><code>Firebase UID: {uid}</code></details>
 </section></main>
}

type MembershipState = { status: 'checking' | 'active' | 'missing' | 'blocked' | 'error'; uid?: string; salonId?: string }

export function AuthGate() {
 const {user,loading,logOut,switchAccount}=useAuth()
 const userUid=user?.uid
 const [membership,setMembership]=useState<MembershipState>({status:'checking'})
 const [deviceId]=useState(()=>crypto.randomUUID())
 const [retryCount,setRetryCount]=useState(0)
 async function createOwnerTenant(salonName:string){
   if(!userUid)throw new Error('Bạn cần đăng nhập Google trước khi tạo salon.')
   await provisionOwnerSalon(userUid,salonName)
   setRetryCount(value=>value+1)
 }
 useEffect(()=>{
   let cancelled=false
   async function verify(){
     if(!userUid){setMembership({status:'checking'});return}
     setMembership({status:'checking',uid:userUid})
     if(!firestore){setMembership({status:'error',uid:userUid});return}
     try{
       const snapshot=await getDoc(doc(firestore,'memberships',userUid))
       const data=snapshot.data()
       if(cancelled)return
       const valid=snapshot.exists()&&data?.status==='active'&&data?.role==='owner'&&typeof data?.salonId==='string'&&data.salonId.trim().length>0
       setMembership(valid?{status:'active',uid:userUid,salonId:data.salonId}:{status:snapshot.exists()?'blocked':'missing',uid:userUid})
     }catch{
       if(!cancelled)setMembership({status:'error',uid:userUid})
     }
   }
   void verify()
   return()=>{cancelled=true}
 },[userUid,retryCount])
 if(loading||(user&&(membership.status==='checking'||membership.uid!==userUid)))return <main className="auth-screen"><div className="auth-loading"><LoaderCircle className="spin"/>Đang kiểm tra quyền truy cập…</div></main>
 if(!user)return <SignInScreen/>
 if(membership.status!=='active'||!membership.salonId)return <AccessPending message={membership.status==='missing'?'Tài khoản Google chưa có không gian salon.':membership.status==='blocked'?'Tài khoản đã có hồ sơ quyền chưa hợp lệ hoặc chưa được kích hoạt. Vui lòng liên hệ quản trị viên.':'Không thể xác minh quyền truy cập. Kiểm tra kết nối mạng và cấu hình Firebase rồi thử lại.'} onRetry={()=>setRetryCount(value=>value+1)} retrying={membership.status==='checking'} onLogOut={()=>void logOut()} onSwitchAccount={switchAccount} email={user.email??''} uid={user.uid} canCreateSalon={membership.status==='missing'} onCreateSalon={createOwnerTenant}/>
 const actor:ActorContext={salonId:membership.salonId,actorId:user.uid,deviceId}
 return <OwnerProvider value={actor}><RouterProvider router={router}/></OwnerProvider>
}
