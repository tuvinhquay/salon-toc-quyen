import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { clearEnaUnreadCount, getEnaUnreadCount, subscribeEnaUnreadCount } from './assistant-notifications'

export function FloatingAssistant() {
  const [unreadCount, setUnreadCount] = useState(() => getEnaUnreadCount())

  useEffect(() => subscribeEnaUnreadCount(setUnreadCount), [])

  const notificationLabel = unreadCount > 0
    ? `ENA có ${unreadCount} tin nhắn mới. Mở trợ lý`
    : 'Mở trợ lý ENA'

  return (
    <Link
      to={"/assistant" as never}
      className="assistant-fab"
      aria-label={notificationLabel}
      title={notificationLabel}
      onClick={() => clearEnaUnreadCount()}
    >
      <span className="assistant-robot" aria-hidden="true">
        <span className="robot-antenna" />
        <span className="robot-head">
          <span className="robot-ear robot-ear-left" />
          <span className="robot-ear robot-ear-right" />
          <span className="robot-eye robot-eye-left" />
          <span className="robot-eye robot-eye-right" />
          <span className="robot-mouth" />
        </span>
        <span className="robot-neck" />
      </span>
      <span className="assistant-fab-label">ENA</span>
      <span className="assistant-fab-pulse" />
      <span className="assistant-notification-bell" aria-hidden="true"><Bell size={17}/></span>
      {unreadCount > 0 && <span className="assistant-unread-badge" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </Link>
  )
}
