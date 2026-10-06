import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const app = express()
const PORT = process.env.API_PORT || 3001
const JWT_SECRET = 'careconnect-jwt-secret-2026'

app.use(cors())
app.use(express.json())

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY DATA STORE
// ═══════════════════════════════════════════════════════════════

const users = [
  {
    id: 1,
    name: 'Alex Rivera',
    email: 'demo@careconnect.app',
    password: bcrypt.hashSync('demo1234', 10),
    phone: '+1 (555) 234-5678',
    dob: '1988-03-14',
    bloodType: 'A+',
    patientId: 'PAT-00412',
    gender: 'Non-binary',
    address: '42 Maple Street, San Francisco, CA 94102',
    emergencyContact: 'Jordan Rivera — +1 (555) 987-6543',
    createdAt: '2024-01-15T10:00:00Z',
  },
]
let nextUserId = 2

const doctors = [
  { id: 1, name: 'Dr. Sarah Okonkwo', specialty: 'Cardiology', hospital: 'Metro General Hospital', rating: 4.9, reviews: 312, photo: 'photo-1651008376811-b90baee60c1f', experience: 14, consultType: 'both', fee: 150, bio: 'Board-certified cardiologist with expertise in preventive cardiology, heart failure management, and advanced cardiac imaging. Committed to patient-centered care and evidence-based medicine.', languages: ['English', 'Yoruba'], education: 'Johns Hopkins School of Medicine', nextAvailable: 'Tomorrow, 10:00 AM', available: ['Mon', 'Wed', 'Fri'] },
  { id: 2, name: 'Dr. Marcus Delgado', specialty: 'Neurology', hospital: 'Northside Medical Center', rating: 4.8, reviews: 198, photo: 'photo-1612349317150-e413f6a5b16d', experience: 11, consultType: 'both', fee: 150, bio: 'Neurologist specializing in epilepsy, headache disorders, and movement diseases. Research focus on early detection of neurodegenerative conditions.', languages: ['English', 'Spanish'], education: 'UCSF School of Medicine', nextAvailable: 'Sep 24, 2:30 PM', available: ['Tue', 'Thu', 'Sat'] },
  { id: 3, name: 'Dr. Priya Nair', specialty: 'General Practice', hospital: 'Riverside Clinic', rating: 4.7, reviews: 541, photo: 'photo-1594824476967-48c8b964273f', experience: 8, consultType: 'both', fee: 75, bio: 'Family medicine physician dedicated to comprehensive primary care for patients of all ages. Special interest in preventive medicine and chronic disease management.', languages: ['English', 'Malayalam', 'Hindi'], education: 'Stanford School of Medicine', nextAvailable: 'Today, 3:15 PM', available: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { id: 4, name: 'Dr. James Whitfield', specialty: 'Orthopedics', hospital: 'Metro General Hospital', rating: 4.6, reviews: 227, photo: 'photo-1622253692010-333f2da6031d', experience: 19, consultType: 'in-person', fee: 120, bio: 'Orthopedic surgeon with 19 years specializing in joint replacement, sports injuries, and trauma surgery. Pioneer in minimally invasive techniques.', languages: ['English'], education: 'Mayo Clinic Alix School of Medicine', nextAvailable: 'Sep 25, 9:00 AM', available: ['Mon', 'Wed', 'Thu'] },
  { id: 5, name: 'Dr. Amara Mensah', specialty: 'Dermatology', hospital: 'Eastview Health Center', rating: 4.9, reviews: 389, photo: 'photo-1559839734-2b71ea197ec2', experience: 10, consultType: 'virtual', fee: 100, bio: 'Dermatologist specializing in medical, cosmetic, and surgical dermatology. Expert in skin cancer screening, acne, eczema, and psoriasis management.', languages: ['English', 'Twi', 'French'], education: 'Harvard Medical School', nextAvailable: 'Sep 26, 11:30 AM', available: ['Tue', 'Fri', 'Sat'] },
  { id: 6, name: 'Dr. Chen Wei', specialty: 'Psychiatry', hospital: 'Lakeside Wellness Center', rating: 4.8, reviews: 163, photo: 'photo-1612531386530-97286d97c2d2', experience: 13, consultType: 'virtual', fee: 130, bio: 'Psychiatrist specializing in anxiety, depression, ADHD, and cognitive-behavioral therapy. Trained in trauma-informed care and mindfulness-based interventions.', languages: ['English', 'Mandarin'], education: 'Columbia University College of Physicians', nextAvailable: 'Sep 23, 4:00 PM', available: ['Mon', 'Wed', 'Fri'] },
]

let appointments = [
  { id: 1, userId: 1, doctorId: 1, doctor: 'Dr. Sarah Okonkwo', specialty: 'Cardiology', date: '2026-09-23', time: '10:00 AM', type: 'Virtual', status: 'upcoming', location: 'Video Call', notes: 'Follow-up for ECG results. Please fast for 4 hours before.', fee: 150, paymentStatus: 'paid', paymentId: 'PAY-7GH3K', createdAt: '2026-09-20T14:30:00Z' },
  { id: 2, userId: 1, doctorId: 3, doctor: 'Dr. Priya Nair', specialty: 'General Practice', date: '2026-09-25', time: '3:15 PM', type: 'In-Person', status: 'upcoming', location: 'Riverside Clinic, Room 204', notes: 'Annual physical checkup', fee: 75, paymentStatus: 'paid', paymentId: 'PAY-2MN8P', createdAt: '2026-09-21T09:00:00Z' },
  { id: 3, userId: 1, doctorId: 4, doctor: 'Dr. James Whitfield', specialty: 'Orthopedics', date: '2026-09-18', time: '9:00 AM', type: 'In-Person', status: 'completed', location: 'Metro General, Wing B, Rm 312', notes: 'Left knee pain evaluation', fee: 120, paymentStatus: 'paid', paymentId: 'PAY-5QR1T', createdAt: '2026-09-15T11:00:00Z' },
  { id: 4, userId: 1, doctorId: 5, doctor: 'Dr. Amara Mensah', specialty: 'Dermatology', date: '2026-09-10', time: '11:30 AM', type: 'Virtual', status: 'completed', location: 'Video Call', notes: 'Eczema flare-up consultation', fee: 100, paymentStatus: 'paid', paymentId: 'PAY-9WX4Y', createdAt: '2026-09-08T16:00:00Z' },
  { id: 5, userId: 1, doctorId: 2, doctor: 'Dr. Marcus Delgado', specialty: 'Neurology', date: '2026-09-05', time: '2:30 PM', type: 'In-Person', status: 'cancelled', location: 'Northside Medical Center, 3rd Floor', notes: '', fee: 150, paymentStatus: 'refunded', paymentId: 'PAY-3ZA6B', createdAt: '2026-09-01T10:00:00Z' },
]
let nextApptId = 6
const otpStore = new Map()
const eventClients = new Map()

const paymentsStore = [
  { id: 'PAY-7GH3K', userId: 1, doctorId: 1, amount: 155, consultationFee: 150, platformFee: 5, status: 'success', last4: '4242', brand: 'Visa', cardName: 'Alex Rivera', createdAt: '2026-09-20T14:30:00Z' },
  { id: 'PAY-2MN8P', userId: 1, doctorId: 3, amount: 80, consultationFee: 75, platformFee: 5, status: 'success', last4: '4242', brand: 'Visa', cardName: 'Alex Rivera', createdAt: '2026-09-21T09:00:00Z' },
  { id: 'PAY-5QR1T', userId: 1, doctorId: 4, amount: 125, consultationFee: 120, platformFee: 5, status: 'success', last4: '8888', brand: 'Mastercard', cardName: 'Alex Rivera', createdAt: '2026-09-15T11:00:00Z' },
  { id: 'PAY-9WX4Y', userId: 1, doctorId: 5, amount: 105, consultationFee: 100, platformFee: 5, status: 'success', last4: '4242', brand: 'Visa', cardName: 'Alex Rivera', createdAt: '2026-09-08T16:00:00Z' },
]

const records = {
  1: {
    vitals: { bloodPressure: '118/76', heartRate: 72, bloodGlucose: 98, bmi: 23.4, cholesterol: 187, oxygenSat: 98, weight: '74 kg', height: '178 cm', updatedAt: '2026-09-18' },
    conditions: ['Hypertension (diagnosed 2019)', 'Type 2 Diabetes (diagnosed 2021)', 'Seasonal allergies'],
    allergies: ['Penicillin', 'Aspirin', 'Latex', 'Pollen'],
    medications: [
      { name: 'Lisinopril', dose: '10mg', frequency: 'Once daily (morning)', refillDate: '2026-10-15', doctor: 'Dr. Okonkwo', startDate: '2019-06-01' },
      { name: 'Metformin', dose: '500mg', frequency: 'Twice daily (with meals)', refillDate: '2026-10-22', doctor: 'Dr. Nair', startDate: '2021-03-15' },
      { name: 'Atorvastatin', dose: '20mg', frequency: 'Once nightly', refillDate: '2026-11-01', doctor: 'Dr. Okonkwo', startDate: '2021-08-10' },
      { name: 'Cetirizine', dose: '10mg', frequency: 'Once daily (as needed)', refillDate: '2026-10-30', doctor: 'Dr. Nair', startDate: '2022-04-01' },
    ],
    labs: [
      { id: 'L001', name: 'Complete Blood Count', date: '2026-09-10', status: 'Normal', doctor: 'Dr. Nair', result: 'All values within normal range' },
      { id: 'L002', name: 'Lipid Panel', date: '2026-09-10', status: 'Normal', doctor: 'Dr. Okonkwo', result: 'Total cholesterol 187 mg/dL — within target' },
      { id: 'L003', name: 'HbA1c', date: '2026-08-15', status: 'Normal', doctor: 'Dr. Nair', result: '6.4% — within target range for diabetics' },
      { id: 'L004', name: 'ECG (12-lead)', date: '2026-08-05', status: 'Review needed', doctor: 'Dr. Okonkwo', result: 'Minor ST changes observed — follow-up recommended' },
      { id: 'L005', name: 'Thyroid Panel (TSH)', date: '2026-07-20', status: 'Normal', doctor: 'Dr. Nair', result: 'TSH 2.1 mIU/L — normal range' },
      { id: 'L006', name: 'Basic Metabolic Panel', date: '2026-07-01', status: 'Normal', doctor: 'Dr. Nair', result: 'Kidney, liver, and electrolytes — all normal' },
    ],
  },
}

const messagesStore = {
  1: [
    {
      threadId: 't1', doctorId: 1, doctorName: 'Dr. Sarah Okonkwo', photo: 'photo-1651008376811-b90baee60c1f', unread: 2,
      messages: [
        { id: 'm1', from: 'doctor', text: "Hello Alex, I've reviewed your recent ECG results and wanted to reach out.", time: '2:10 PM', date: '2026-09-22' },
        { id: 'm2', from: 'patient', text: "Thank you Doctor. Is everything looking okay? I've been a bit worried.", time: '2:45 PM', date: '2026-09-22' },
        { id: 'm3', from: 'doctor', text: "There's no immediate concern. Your ECG shows minor ST changes that are common and not dangerous. We'll discuss it in detail during your virtual appointment tomorrow.", time: '3:02 PM', date: '2026-09-22' },
        { id: 'm4', from: 'doctor', text: "Please prepare a list of any symptoms — chest tightness, shortness of breath, or dizziness — even if they seem minor.", time: '3:03 PM', date: '2026-09-22' },
      ],
    },
    {
      threadId: 't2', doctorId: 3, doctorName: 'Dr. Priya Nair', photo: 'photo-1594824476967-48c8b964273f', unread: 0,
      messages: [
        { id: 'm5', from: 'patient', text: "Hi Dr. Nair, just confirming my appointment for the 25th. Should I fast beforehand?", time: '10:00 AM', date: '2026-09-21' },
        { id: 'm6', from: 'doctor', text: "No need to fast for your annual checkup. Just drink water normally. See you on Thursday!", time: '11:30 AM', date: '2026-09-21' },
      ],
    },
  ],
}

const notificationsStore = {
  1: [
    { id: 'n1', type: 'reminder', title: 'Virtual Appointment Tomorrow', message: "Your appointment with Dr. Okonkwo is at 10:00 AM. Join link will be sent 30 min before.", time: '2h ago', read: false, createdAt: '2026-09-22T10:00:00Z' },
    { id: 'n2', type: 'confirmed', title: 'Booking Confirmed', message: "Your appointment with Dr. Nair on Sep 25 at 3:15 PM is confirmed.", time: '1d ago', read: false, createdAt: '2026-09-21T09:00:00Z' },
    { id: 'n3', type: 'medication', title: 'Medication Reminder', message: "Time to take your evening dose of Atorvastatin (20mg).", time: '6h ago', read: true, createdAt: '2026-09-22T20:00:00Z' },
    { id: 'n4', type: 'lab', title: 'Lab Results Available', message: "Your CBC and Lipid Panel results from Sep 10 are now available.", time: '2d ago', read: true, createdAt: '2026-09-20T14:00:00Z' },
    { id: 'n5', type: 'refill', title: 'Prescription Refill Due', message: "Your Lisinopril prescription is due for refill on Oct 15.", time: '3d ago', read: true, createdAt: '2026-09-19T09:00:00Z' },
  ],
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized — please log in' })
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Session expired — please log in again' })
  }
}

function publish(userId, event) {
  const clients = eventClients.get(userId) || []
  const payload = `data: ${JSON.stringify(event)}\n\n`
  clients.forEach(client => client.write(payload))
}

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' }))

app.get('/api/events', (req, res) => {
  const token = req.query.token
  if (typeof token !== 'string') return res.status(401).end()
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const userId = payload.userId
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    const clients = eventClients.get(userId) || []
    clients.push(res)
    eventClients.set(userId, clients)
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000)
    req.on('close', () => {
      clearInterval(heartbeat)
      const remaining = (eventClients.get(userId) || []).filter(client => client !== res)
      if (remaining.length) eventClients.set(userId, remaining)
      else eventClients.delete(userId)
    })
  } catch {
    res.status(401).end()
  }
})

// ─── Auth ──────────────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, dob, gender } = req.body
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ error: 'Name, email, and password are required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  if (users.find(u => u.email === email.toLowerCase())) return res.status(409).json({ error: 'An account with this email already exists' })

  const user = {
    id: nextUserId++,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: bcrypt.hashSync(password, 10),
    phone: phone || '',
    dob: dob || '',
    gender: gender || '',
    bloodType: '',
    patientId: `PAT-${Math.floor(10000 + Math.random() * 90000)}`,
    address: '',
    emergencyContact: '',
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  records[user.id] = { vitals: {}, conditions: [], allergies: [], medications: [], labs: [] }
  messagesStore[user.id] = []
  notificationsStore[user.id] = []

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  const { password: _, ...safe } = user
  res.status(201).json({ token, user: safe })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = users.find(u => u.email === email?.toLowerCase())
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' })
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  const { password: _, ...safe } = user
  res.json({ token, user: safe })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.user.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const { password: _, ...safe } = user
  res.json(safe)
})

// ─── Doctors ───────────────────────────────────────────────────

app.get('/api/doctors', (req, res) => {
  let result = [...doctors]
  const { specialty, q } = req.query
  if (specialty && specialty !== 'All') result = result.filter(d => d.specialty === specialty)
  if (q) {
    const lq = q.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(lq) ||
      d.specialty.toLowerCase().includes(lq) ||
      d.hospital.toLowerCase().includes(lq)
    )
  }
  res.json(result)
})

app.get('/api/doctors/:id', (req, res) => {
  const doc = doctors.find(d => d.id === parseInt(req.params.id))
  doc ? res.json(doc) : res.status(404).json({ error: 'Doctor not found' })
})

// ─── Appointments ──────────────────────────────────────────────

app.get('/api/appointments', requireAuth, (req, res) => {
  const appts = appointments
    .filter(a => a.userId === req.user.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  res.json(appts)
})

app.post('/api/appointments', requireAuth, (req, res) => {
  const { doctorId, date, time, type, notes, paymentId } = req.body
  const doc = doctors.find(d => d.id === parseInt(doctorId))
  if (!doc) return res.status(404).json({ error: 'Doctor not found' })

  const appt = {
    id: nextApptId++,
    userId: req.user.userId,
    doctorId: parseInt(doctorId),
    doctor: doc.name,
    specialty: doc.specialty,
    date,
    time,
    type: type || 'In-Person',
    status: paymentId ? 'pending_verification' : 'upcoming',
    location: type === 'Virtual' ? 'Video Call' : doc.hospital,
    notes: notes || '',
    fee: doc.fee,
    paymentStatus: paymentId ? 'paid' : 'pending',
    paymentId: paymentId || null,
    createdAt: new Date().toISOString(),
  }
  appointments.push(appt)

  publish(req.user.userId, { type: 'appointment.created', appointmentId: appt.id })

  const notifs = notificationsStore[req.user.userId]
  if (notifs) {
    notifs.unshift({
      id: `n_${Date.now()}`,
      type: 'confirmed',
      title: paymentId ? 'Verify Your Appointment' : 'Appointment Confirmed',
      message: paymentId
        ? `Your payment is secure. Verify your ${type} appointment with ${doc.name} to finish booking.`
        : `Your ${type} appointment with ${doc.name} on ${date} at ${time} is confirmed.`,
      time: 'Just now',
      read: false,
      createdAt: new Date().toISOString(),
    })
  }
  res.status(201).json(appt)
})

app.post('/api/appointments/:id/otp', requireAuth, (req, res) => {
  const appt = appointments.find(a => a.id === parseInt(req.params.id) && a.userId === req.user.userId)
  if (!appt) return res.status(404).json({ error: 'Appointment not found' })
  if (appt.status !== 'pending_verification') return res.status(400).json({ error: 'This appointment does not need verification' })
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = Date.now() + 10 * 60 * 1000
  otpStore.set(appt.id, { code, expiresAt, attempts: 0 })
  res.json({ message: 'Verification code sent to your registered phone', expiresAt: new Date(expiresAt).toISOString(), developmentCode: code })
})

app.post('/api/appointments/:id/verify-otp', requireAuth, (req, res) => {
  const appt = appointments.find(a => a.id === parseInt(req.params.id) && a.userId === req.user.userId)
  const entry = otpStore.get(appt?.id)
  if (!appt || !entry) return res.status(400).json({ error: 'Request a new verification code first' })
  if (Date.now() > entry.expiresAt) return res.status(400).json({ error: 'This code has expired. Request a new one.' })
  if (++entry.attempts > 5) return res.status(429).json({ error: 'Too many attempts. Request a new code.' })
  if (req.body.code !== entry.code) return res.status(400).json({ error: 'Incorrect verification code' })
  appt.status = 'upcoming'
  otpStore.delete(appt.id)
  publish(req.user.userId, { type: 'appointment.updated', appointmentId: appt.id })
  res.json(appt)
})

app.put('/api/appointments/:id/cancel', requireAuth, (req, res) => {
  const appt = appointments.find(a => a.id === parseInt(req.params.id) && a.userId === req.user.userId)
  if (!appt) return res.status(404).json({ error: 'Appointment not found' })
  if (appt.status !== 'upcoming') return res.status(400).json({ error: 'Only upcoming appointments can be cancelled' })
  appt.status = 'cancelled'
  appt.paymentStatus = 'refunded'
  publish(req.user.userId, { type: 'appointment.updated', appointmentId: appt.id })
  res.json(appt)
})

app.put('/api/appointments/:id/reschedule', requireAuth, (req, res) => {
  const { date, time } = req.body
  const appt = appointments.find(a => a.id === parseInt(req.params.id) && a.userId === req.user.userId)
  if (!appt) return res.status(404).json({ error: 'Appointment not found' })
  if (appt.status !== 'upcoming') return res.status(400).json({ error: 'Only upcoming appointments can be rescheduled' })
  appt.date = date
  appt.time = time
  publish(req.user.userId, { type: 'appointment.updated', appointmentId: appt.id })
  res.json(appt)
})

// ─── Payments ──────────────────────────────────────────────────

app.post('/api/payments/process', requireAuth, (req, res) => {
  const { cardNumber, cardName, expiry, cvv, amount, doctorId } = req.body
  if (!cardNumber || !cardName || !expiry || !cvv) return res.status(400).json({ error: 'All payment details are required' })

  const clean = cardNumber.replace(/\s/g, '')
  if (clean.length < 13 || clean.length > 19) return res.status(400).json({ error: 'Invalid card number' })
  if (clean.endsWith('0000')) return res.status(402).json({ error: 'Payment declined. Please check your card details or try another card.' })

  const paymentId = `PAY-${Date.now().toString(36).toUpperCase().slice(-5)}`
  const brand = clean.startsWith('4') ? 'Visa' : clean.startsWith('5') ? 'Mastercard' : clean.startsWith('3') ? 'Amex' : 'Card'
  const payment = {
    id: paymentId,
    userId: req.user.userId,
    doctorId: parseInt(doctorId),
    amount: parseFloat(amount),
    consultationFee: parseFloat(amount) - 5,
    platformFee: 5,
    status: 'success',
    last4: clean.slice(-4),
    brand,
    cardName,
    createdAt: new Date().toISOString(),
  }
  paymentsStore.push(payment)
  res.status(201).json(payment)
})

app.get('/api/payments', requireAuth, (req, res) => {
  const p = paymentsStore
    .filter(p => p.userId === req.user.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(p)
})

// ─── Records ───────────────────────────────────────────────────

app.get('/api/records', requireAuth, (req, res) => {
  const rec = records[req.user.userId]
  rec ? res.json(rec) : res.status(404).json({ error: 'No records found' })
})

// ─── Messages ──────────────────────────────────────────────────

app.get('/api/messages', requireAuth, (req, res) => {
  res.json(messagesStore[req.user.userId] || [])
})

app.post('/api/messages/send', requireAuth, (req, res) => {
  const { doctorId, text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Message text is required' })

  const userId = req.user.userId
  if (!messagesStore[userId]) messagesStore[userId] = []

  let thread = messagesStore[userId].find(t => t.doctorId === parseInt(doctorId))
  if (!thread) {
    const doc = doctors.find(d => d.id === parseInt(doctorId))
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })
    thread = { threadId: `t_${Date.now()}`, doctorId: parseInt(doctorId), doctorName: doc.name, photo: doc.photo, unread: 0, messages: [] }
    messagesStore[userId].push(thread)
  }

  const msg = {
    id: `m_${Date.now()}`,
    from: 'patient',
    text: text.trim(),
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toISOString().split('T')[0],
  }
  thread.messages.push(msg)

  const replies = [
    "Thank you for your message. I've noted this and will review it before our appointment.",
    "Understood. Please monitor your symptoms and don't hesitate to contact us if things worsen.",
    "I appreciate you reaching out. Your health is our top priority. We'll address this at your next visit.",
    "I'll review this shortly. If you experience any urgent symptoms, please visit the ER immediately.",
    "Thanks for the update. We'll address this thoroughly during your next appointment.",
  ]
  setTimeout(() => {
    thread.messages.push({
      id: `m_${Date.now() + 1}`,
      from: 'doctor',
      text: replies[Math.floor(Math.random() * replies.length)],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
    })
    thread.unread = (thread.unread || 0) + 1
  }, 2500)

  res.status(201).json(msg)
})

// ─── Notifications ─────────────────────────────────────────────

app.get('/api/notifications', requireAuth, (req, res) => {
  res.json(notificationsStore[req.user.userId] || [])
})

app.put('/api/notifications/:id/read', requireAuth, (req, res) => {
  const notifs = notificationsStore[req.user.userId] || []
  const n = notifs.find(n => n.id === req.params.id)
  if (n) n.read = true
  res.json({ success: true })
})

app.put('/api/notifications/read-all', requireAuth, (req, res) => {
  const notifs = notificationsStore[req.user.userId] || []
  notifs.forEach(n => n.read = true)
  res.json({ success: true })
})

// ═══════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🏥  CareConnect API → http://localhost:${PORT}`)
  console.log(`    Demo login: demo@careconnect.app / demo1234\n`)
})
