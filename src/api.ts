// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  phone: string
  dob: string
  bloodType: string
  patientId: string
  gender: string
  address: string
  emergencyContact: string
  createdAt: string
}

export interface Doctor {
  id: number
  name: string
  specialty: string
  hospital: string
  rating: number
  reviews: number
  photo: string
  experience: number
  consultType: 'in-person' | 'virtual' | 'both'
  fee: number
  bio: string
  languages: string[]
  education: string
  nextAvailable: string
  available: string[]
}

export interface Appointment {
  id: number
  doctorId: number
  photo: string
  doctor: string
  specialty: string
  date: string
  time: string
  type: 'In-Person' | 'Virtual'
  status: 'upcoming' | 'pending_verification' | 'completed' | 'cancelled'
  location: string
  notes: string
  fee: number
  paymentStatus: string
  paymentId: string
  createdAt: string
}

export interface Payment {
  id: string
  doctorId: number
  amount: number
  consultationFee: number
  platformFee: number
  status: string
  last4: string
  brand: string
  cardName: string
  createdAt: string
}

export interface HealthRecord {
  vitals: {
    bloodPressure?: string
    heartRate?: number
    bloodGlucose?: number
    bmi?: number
    cholesterol?: number
    oxygenSat?: number
    weight?: string
    height?: string
    updatedAt?: string
  }
  conditions: string[]
  allergies: string[]
  medications: Array<{
    name: string
    dose: string
    frequency: string
    refillDate: string
    doctor: string
    startDate: string
  }>
  labs: Array<{
    id: string
    name: string
    date: string
    status: string
    doctor: string
    result: string
  }>
}

export interface Message {
  id: string
  from: 'patient' | 'doctor'
  text: string
  time: string
  date: string
}

export interface MessageThread {
  threadId: string
  doctorId: number
  doctorName: string
  photo: string
  unread: number
  messages: Message[]
}

export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  time: string
  read: boolean
  createdAt: string
}

// ─── Client ───────────────────────────────────────────────────────────────────

const BASE = '/api'

function getToken() {
  return localStorage.getItem('cc_token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({ error: 'Network error — is the server running?' }))
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed')
  return data as T
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: { name: string; email: string; password: string; phone?: string; dob?: string; gender?: string }) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<User>('/auth/me'),
  },

  doctors: {
    list: (params?: { specialty?: string; q?: string }) => {
      const entries = Object.entries(params || {}).filter(([, v]) => v && v !== 'All')
      const qs = entries.length ? '?' + new URLSearchParams(Object.fromEntries(entries)).toString() : ''
      return request<Doctor[]>(`/doctors${qs}`)
    },
    get: (id: number) => request<Doctor>(`/doctors/${id}`),
  },

  appointments: {
    list: () => request<Appointment[]>('/appointments'),

    create: (data: {
      doctorId: number
      date: string
      time: string
      type: string
      notes?: string
      paymentId?: string
    }) =>
      request<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    cancel: (id: number) =>
      request<Appointment>(`/appointments/${id}/cancel`, { method: 'PUT' }),

    reschedule: (id: number, date: string, time: string) =>
      request<Appointment>(`/appointments/${id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ date, time }),
      }),

    requestOtp: (id: number) =>
      request<{ message: string; expiresAt: string; developmentCode?: string }>(`/appointments/${id}/otp`, { method: 'POST' }),

    verifyOtp: (id: number, code: string) =>
      request<Appointment>(`/appointments/${id}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  },

  payments: {
    process: (data: {
      cardNumber: string
      cardName: string
      expiry: string
      cvv: string
      amount: number
      doctorId: number
      appointmentType: string
    }) =>
      request<Payment>('/payments/process', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: () => request<Payment[]>('/payments'),
  },

  records: {
    get: () => request<HealthRecord>('/records'),
  },

  messages: {
    list: () => request<MessageThread[]>('/messages'),
    send: (doctorId: number, text: string) =>
      request<Message>('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ doctorId, text }),
      }),
  },

  notifications: {
    list: () => request<AppNotification[]>('/notifications'),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
  },

  events: {
    subscribe: (onEvent: (event: { type: string; appointmentId?: number }) => void) => {
      const token = getToken()
      if (!token) return () => {}
      const source = new EventSource(`${BASE}/events?token=${encodeURIComponent(token)}`)
      source.onmessage = event => {
        try { onEvent(JSON.parse(event.data)) } catch {}
      }
      return () => source.close()
    },
  },
}
