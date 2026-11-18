import { useState } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { Chrome, LoaderCircle, ShieldCheck, WifiOff } from 'lucide-react'
import { router } from '../app/router'
import { useAuth } from './AuthProvider'

function SignInScreen() {
  const { configured, signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setBusy(true)
    setError(null)
    try {
      await signIn()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Đăng nhập thất bại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-mark"><ShieldCheck size={26} /></div>
        <small>SALON MANAGEMENT · OWNER ACCESS</small>
        <h1>TÓC QUYỀN</h1>
        <p>Không gian quản lý riêng dành cho chủ salon. Đăng nhập để tiếp tục.</p>
        {!configured ? (
          <div className="auth-warning"><WifiOff size={17} /><span>Firebase chưa được cấu hình. Cần bổ sung cấu hình ứng dụng và bật Google Authentication trước khi đăng nhập.</span></div>
        ) : (
          <button className="google-signin" onClick={handleSignIn} disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <Chrome size={18} />}
            {busy ? 'Đang kết nối…' : 'Đăng nhập bằng Google'}
          </button>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="auth-foot">DỮ LIỆU KINH DOANH ĐƯỢC BẢO VỆ</div>
      </section>
    </main>
  )
}

export function AuthGate() {
  const { user, loading } = useAuth()
  if (loading) return <main className="auth-screen"><div className="auth-loading"><LoaderCircle className="spin" />Đang kiểm tra phiên đăng nhập…</div></main>
  if (!user) return <SignInScreen />
  return <RouterProvider router={router} />
}
