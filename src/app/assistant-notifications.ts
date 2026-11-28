const STORAGE_KEY = 'ena-unread-messages-v1'
const EVENT_NAME = 'ena-unread-messages-changed'

function readCount(): number {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0)
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
  } catch {
    return 0
  }
}

function publish(count: number) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: count }))
}

export function getEnaUnreadCount(): number {
  return readCount()
}

export function incrementEnaUnreadCount(): number {
  const count = readCount() + 1
  try { window.localStorage.setItem(STORAGE_KEY, String(count)) } catch { /* Notification remains usable for this page session. */ }
  publish(count)
  return count
}

export function clearEnaUnreadCount(): void {
  try { window.localStorage.setItem(STORAGE_KEY, '0') } catch { /* Continue without persisted badge. */ }
  publish(0)
}

export function subscribeEnaUnreadCount(listener: (count: number) => void): () => void {
  const onChange = (event: Event) => {
    const detail = (event as CustomEvent<number>).detail
    listener(typeof detail === 'number' ? detail : readCount())
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener(readCount())
  }
  window.addEventListener(EVENT_NAME, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT_NAME, onChange)
    window.removeEventListener('storage', onStorage)
  }
}
