import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { RouterProvider } from '@tanstack/react-router'
import { firebaseFunctions, firestore } from '../lib/firebase'
import { Chrome, LoaderCircle, ShieldCheck, WifiOff } from 'lucide-react'
import { router } from '../app/router'
import { useAuth } from './AuthProvider'
import { OwnerProvider } from './OwnerContext'
import type { ActorContext } from '../db/types'

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
function AccessPending({message,onRetry,onLogOut,onSwitchAccount,retrying,email,uid,canCreateSalon,onCreateSalon}:{message:string;onRetry:()=>void;onLogOut:()=>void;onSwitchAccount:()=>Promise<void>;retrying:boolean;email:string;uid:string;canCreateSalon:boolean;onCreateSalon:(name:string)=>Promise<void>}) {
 const [switching,setSwitching]=useState(false)
 const [switchError,setSwitchError]=useState<string|null>(null)
 const [salonName,setSalonName]=useState('Salon của tôi')
 const [creatingSalon,setCreatingSalon]=useState(false)
 async function createSalon(){setCreatingSalon(true);setSwitchError(null);try{await onCreateSalon(salonName)}catch(cause){setSwitchError(cause instanceof Error?cause.message:'Chưa thể tạo không gian salon.')}finally{setCreatingSalon(false)}}
 async function switchAccount(){
   setSwitching(true);setSwitchError(null)
   try{await onSwitchAccount()}catch(cause){setSwitchError(cause instanceof Error?cause.message:'Chưa thể đổi tài khoản Google.')}
   finally{setSwitching(false)}
 }
 return <main className="auth-screen"><section className="auth-card"><div className="auth-mark"><ShieldCheck size={26}/></div><small>OWNER ACCESS CONTROL</small><h1>Chưa được cấp quyền</h1><p>{message}</p>{email&&<p className="access-account-email">Tài khoản hiện tại: <b>{email}</b></p>}<p className="access-account-uid">Firebase UID: <code>{uid}</code></p><button className="google-signin" onClick={onRetry} disabled={retrying}>{retrying?<LoaderCircle className="spin" size={18}/>:<ShieldCheck size={18} />}{retrying?'Đang kiểm tra…':'Thử kiểm tra lại quyền Owner'}</button><button className="google-signin" onClick={()=>void switchAccount()} disabled={retrying||switching}>{switching?<LoaderCircle className="spin" size={18}/>:<Chrome size={18}/>} {switching?'Đang đổi tài khoản…':'Đổi tài khoản Google'}</button>{canCreateSalon&&<div className="owner-tenant-setup"><p>Tài khoản này chưa có không gian salon. Bạn có thể tạo một không gian riêng; dữ liệu sẽ được tách theo mã salon và tài khoản Google của bạn.</p><input aria-label="Tên salon mới" maxLength={80} minLength={2} value={salonName} onChange={event=>setSalonName(event.target.value)} placeholder="Tên salon"/><button className="google-signin" onClick={()=>void createSalon()} disabled={creatingSalon||salonName.trim().length<2}>{creatingSalon?<LoaderCircle className="spin" size={18}/>:<ShieldCheck size={18}/>} {creatingSalon?'Đang tạo không gian…':'Tạo không gian salon riêng'}</button></div>}{switchError&&<p className="auth-error" role="alert">{switchError}</p>}<button className="subtle-button" onClick={onLogOut} disabled={retrying||switching}>Đăng xuất</button><div className="auth-foot">CHỈ THÀNH VIÊN ĐƯỢC DUYỆT MỚI TRUY CẬP ĐƯỢC SALON</div></section></main>
}
type MembershipState = { status: 'checking' | 'active' | 'missing' | 'blocked' | 'error'; uid?: string; salonId?: string }

export function AuthGate() {
 const {user,loading,logOut,switchAccount}=useAuth()
 const userUid=user?.uid
 const [membership,setMembership]=useState<MembershipState>({status:'checking'})
 const [deviceId]=useState(()=>crypto.randomUUID())
 const [retryCount,setRetryCount]=useState(0)
 async function createOwnerTenant(salonName:string){if(!firebaseFunctions)throw new Error('Firebase Functions chưa được cấu hình.');const create=httpsCallable<{salonName:string},{salonId:string}>(firebaseFunctions,'createOwnerSalon');await create({salonName});setRetryCount(value=>value+1)}
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
 if(membership.status!=='active'||!membership.salonId)return <AccessPending message={membership.status==='missing'?'Google đã đăng nhập thành công nhưng tài khoản chưa có không gian salon. Bạn có thể tạo salon riêng hoặc đổi sang tài khoản khác.':membership.status==='blocked'?'Tài khoản đã có hồ sơ membership nhưng hồ sơ chưa hợp lệ hoặc chưa được kích hoạt. Vui lòng liên hệ quản trị viên.':'Không thể xác minh membership với máy chủ. Kiểm tra kết nối mạng, cấu hình Firebase và Firestore Rules rồi thử lại.'} onRetry={()=>setRetryCount(value=>value+1)} retrying={membership.status==='checking'} onLogOut={()=>void logOut()} onSwitchAccount={switchAccount} email={user.email??''} uid={user.uid} canCreateSalon={membership.status==='missing'} onCreateSalon={createOwnerTenant}/>
 const actor:ActorContext={salonId:membership.salonId,actorId:user.uid,deviceId}
 return <OwnerProvider value={actor}><RouterProvider router={router}/></OwnerProvider>
}
