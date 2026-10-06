import { useState, useEffect } from 'react'
import { useNav } from '../nav'
import { useApp } from '../context'
import { api, type AppNotification } from '../api'

const NOTIF_ICONS: Record<string, string> = {
  reminder: '🔔',
  confirmed: '✅',
  medication: '💊',
  lab: '🧪',
  refill: '♻️',
  cancelled: '❌',
}

export function NotificationsScreen() {
  const { pop } = useNav()
  const { refreshNotifications } = useApp()
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.notifications.list().then(n => { setNotifs(n); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function markAllRead() {
    await api.notifications.markAllRead().catch(() => {})
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    await refreshNotifications()
  }

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-100 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={pop} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-display text-2xl font-semibold flex-1">Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              Mark all read
            </button>
          )}
        </div>
        {unreadCount > 0 && (
          <p className="text-xs text-gray-400 ml-11">{unreadCount} unread</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {loading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}
        {!loading && notifs.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-sm font-semibold text-gray-700">No notifications</p>
          </div>
        )}
        {notifs.map(n => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-5 py-4 ${!n.read ? 'bg-teal-50/40' : ''}`}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: !n.read ? '#EBF5F7' : '#F9FAFB' }}>
              {NOTIF_ICONS[n.type] || '📢'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{n.title}</p>
                {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: 'var(--primary)' }} />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1 font-mono-data">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
