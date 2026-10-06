import { useState, useEffect, useRef } from 'react'
import { useNav } from '../nav'
import { api, type MessageThread, type Message } from '../api'

interface MessagesScreenProps {
  params?: { doctorId?: number }
}

export function MessagesScreen({ params }: MessagesScreenProps) {
  const { pop } = useNav()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.messages.list().then(t => {
      setThreads(t)
      if (params?.doctorId) {
        const found = t.find(x => x.doctorId === params.doctorId)
        if (found) setActiveThread(found)
      } else if (t.length > 0) {
        setActiveThread(t[0])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread?.messages.length])

  // Poll for new messages every 3 seconds when a thread is open
  useEffect(() => {
    if (!activeThread) return
    const interval = setInterval(async () => {
      const updated = await api.messages.list().catch(() => null)
      if (!updated) return
      setThreads(updated)
      const thread = updated.find(t => t.threadId === activeThread.threadId)
      if (thread) setActiveThread(thread)
    }, 3000)
    return () => clearInterval(interval)
  }, [activeThread?.threadId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !activeThread || sending) return
    setSending(true)
    const text = draft
    setDraft('')
    try {
      await api.messages.send(activeThread.doctorId, text)
      // Refresh after sending
      const updated = await api.messages.list()
      setThreads(updated)
      const thread = updated.find(t => t.threadId === activeThread.threadId)
      if (thread) setActiveThread(thread)
    } catch {}
    setSending(false)
  }

  if (activeThread) {
    return (
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setActiveThread(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img src={activeThread.photo} alt={activeThread.doctorName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{activeThread.doctorName}</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
            <svg className="w-4 h-4" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeThread.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === 'patient' ? 'justify-end' : 'justify-start'}`}>
              {msg.from === 'doctor' && (
                <div className="w-7 h-7 rounded-full overflow-hidden mr-2 shrink-0 self-end">
                  <img src={activeThread.photo} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-xs rounded-2xl px-3.5 py-2.5 ${msg.from === 'patient' ? 'rounded-br-md text-white' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'}`}
                style={msg.from === 'patient' ? { background: 'var(--primary)' } : {}}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-xs mt-1 font-mono-data ${msg.from === 'patient' ? 'text-white/60' : 'text-gray-400'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 shrink-0">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={`Message ${activeThread.doctorName.split(' ')[2]}…`}
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-all"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40"
            style={{ background: 'var(--primary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-100 px-5 pt-5 pb-4 flex items-center gap-3">
        <button onClick={pop} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display text-2xl font-semibold">Messages</h1>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {loading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}

        {!loading && threads.length === 0 && (
          <div className="py-16 text-center px-5">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm font-semibold text-gray-700">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Message your doctors after booking an appointment</p>
          </div>
        )}

        {threads.map(thread => {
          const lastMsg = thread.messages[thread.messages.length - 1]
          return (
            <button
              key={thread.threadId}
              onClick={() => setActiveThread(thread)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img src={thread.photo} alt={thread.doctorName} className="w-full h-full object-cover" />
                </div>
                {thread.unread > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: 'var(--accent)' }}>
                    {thread.unread}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${thread.unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{thread.doctorName}</p>
                  {lastMsg && <p className="text-xs text-gray-400 font-mono-data shrink-0">{lastMsg.time}</p>}
                </div>
                {lastMsg && (
                  <p className={`text-xs mt-0.5 truncate ${thread.unread ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
                    {lastMsg.from === 'patient' ? 'You: ' : ''}{lastMsg.text}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
