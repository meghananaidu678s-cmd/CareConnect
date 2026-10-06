import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, type User, type Appointment, type AppNotification } from './api'

interface AppContextType {
  user: User | null
  appointments: Appointment[]
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; phone?: string; dob?: string; gender?: string }) => Promise<void>
  logout: () => void
  refreshAppointments: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const AppContext = createContext<AppContextType>(null!)

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cc_token')
    if (!token) { setLoading(false); return }

    api.auth.me()
      .then(async u => {
        setUser(u)
        await Promise.allSettled([refreshAppointments(), refreshNotifications()])
      })
      .catch(() => { localStorage.removeItem('cc_token') })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    return api.events.subscribe(event => {
      if (event.type === 'appointment.updated' || event.type === 'appointment.created') {
        void refreshAppointments()
        void refreshNotifications()
      }
    })
  }, [user])

  async function login(email: string, password: string) {
    const { token, user: u } = await api.auth.login(email, password)
    localStorage.setItem('cc_token', token)
    setUser(u)
    await Promise.allSettled([refreshAppointments(), refreshNotifications()])
  }

  async function register(data: Parameters<AppContextType['register']>[0]) {
    const { token, user: u } = await api.auth.register(data)
    localStorage.setItem('cc_token', token)
    setUser(u)
  }

  function logout() {
    localStorage.removeItem('cc_token')
    setUser(null)
    setAppointments([])
    setNotifications([])
  }

  async function refreshAppointments() {
    try { setAppointments(await api.appointments.list()) } catch {}
  }

  async function refreshNotifications() {
    try { setNotifications(await api.notifications.list()) } catch {}
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppContext.Provider value={{
      user, appointments, notifications, unreadCount, loading,
      login, register, logout, refreshAppointments, refreshNotifications,
    }}>
      {children}
    </AppContext.Provider>
  )
}
