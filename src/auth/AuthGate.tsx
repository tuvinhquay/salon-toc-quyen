import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { RouterProvider } from '@tanstack/react-router'
import { firestore } from '../lib/firebase'
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
  return <main className="auth-screen"><section className="auth-card"><div className="auth-mark"><ShieldCheck size={26}/></div><small>SALON MANAGEMENT · OWNER ACCESS</small><h1>TÓC QUYỀN</h1><p>Không gian quản lý riêng dành cho chủ salon. Đăng nhập để tiếp tục.</p>{!configured ? <div className="auth-warning"><WifiOff size={17}/><span>Firebase chưa được cấu hình. Cần bổ sung cấu hình ứng dụng và bật Google Authentication trước khi đăng nhập.</span></div> : <button className="google-signin" onClick={handleSignIn} disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<Chrome size={18}/>}{busy?'Đang kết nối…':'Đăng nhập bằng Google'}</button>}{error&&<p className="auth-error" role="alert">{error}</p>}<div className="auth-foot">DỮ LIỆU KINH DOANH ĐƯỢC BẢO VỆ</div></section></main>
}
function AccessPending({message,onLogOut}:{message:string;onLogOut:()=>void}) {
 return <main className="auth-screen"><section className="auth-card"><div className="auth-mark"><ShieldCheck size={26}/></div><small>OWNER ACCESS CONTROL</small><h1>Chưa được cấp quyền</h1><p>{message}</p><button className="google-signin" onClick={onLogOut}>Đăng xuất</button><div className="auth-foot">CHỈ THÀNH VIÊN ĐƯỢC DUYỆT MỚI TRUY CẬP ĐƯỢC SALON</div></section></main>
}
export function AuthGate() {
 const {user,loading,logOut}=useAuth()
 const [membership,setMembership]=useState<{status:'checking'|'active'|'missing'|'error';salonId?:string}>({status:'checking'})
 const [deviceId]=useState(()=>crypto.randomUUID())
 useEffect(()=>{let cancelled=false;async function verify(){if(!user){setMembership({status:'checking'});return}if(!firestore){setMembership({status:'error'});return}try{const snapshot=await getDoc(doc(firestore,'memberships',user.uid));const data=snapshot.data();if(cancelled)return;const valid=snapshot.exists()&&data?.status==='active'&&data?.role==='owner'&&typeof data?.salonId==='string'&&data.salonId.trim().length>0;setMembership(valid?{status:'active',salonId:data.salonId}:{status:'missing'})}catch{if(!cancelled)setMembership({status:'error'})}}void verify();return()=>{cancelled=true}},[user])
 if(loading||(user&&membership.status==='checking'))return <main className="auth-screen"><div className="auth-loading"><LoaderCircle className="spin"/>Đang kiểm tra quyền truy cập…</div></main>
 if(!user)return <SignInScreen/>
 if(membership.status!=='active'||!membership.salonId)return <AccessPending message={membership.status==='missing'?'Tài khoản Google đã đăng nhập nhưng chưa có hồ sơ Owner được cấp quyền. Không thể tự tạo quyền quản trị từ trình duyệt.':'Không thể xác minh membership với máy chủ. Kiểm tra cấu hình Firebase và Firestore Rules rồi thử lại.'} onLogOut={()=>void logOut()}/>
 const actor:ActorContext={salonId:membership.salonId,actorId:user.uid,deviceId}
 return <OwnerProvider value={actor}><RouterProvider router={router}/></OwnerProvider>
}
