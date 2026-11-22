import { Link } from '@tanstack/react-router'

export function FloatingAssistant() {
  return (
    <Link to={"/assistant" as never} className="assistant-fab" aria-label="Mở trợ lý AI TÓC QUYỀN">
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
      <span className="assistant-fab-label">Trợ lý AI</span>
      <span className="assistant-fab-pulse" />
    </Link>
  )
}
