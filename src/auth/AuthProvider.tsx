import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  configured: boolean
  signIn: () => Promise<void>
  logOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
      setError(null)
    }, () => {
      setUser(null)
      setLoading(false)
      setError('Không thể xác minh phiên đăng nhập. Vui lòng tải lại ứng dụng.')
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured: isFirebaseConfigured,
    error,
    signIn: async () => {
      if (!firebaseAuth) throw new Error('Firebase chưa được cấu hình.')
      setError(null)
      try {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        await signInWithPopup(firebaseAuth, provider)
      } catch (cause) {
        const code = cause instanceof Error && 'code' in cause ? String(cause.code) : ''
        if (code === 'auth/popup-closed-by-user') return
        if (code === 'auth/unauthorized-domain') throw new Error('Tên miền hiện tại chưa được cho phép trong Firebase Authentication.')
        if (code === 'auth/popup-blocked') throw new Error('Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.')
        if (code === 'auth/cancelled-popup-request') return
        throw new Error('Đăng nhập Google chưa thành công. Vui lòng thử lại.')
      }
    },
    logOut: async () => {
      if (firebaseAuth) {
        try {
          await signOut(firebaseAuth)
          setError(null)
        } catch {
          setError('Chưa thể đăng xuất. Vui lòng kiểm tra kết nối và thử lại.')
        }
      }
    },
  }), [user, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth phải được sử dụng bên trong AuthProvider.')
  return value
}
