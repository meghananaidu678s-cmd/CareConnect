import { randomInt, randomUUID } from "node:crypto"

import { mkdir, readFile, rename, writeFile } from "node:fs/promises"

import path from "node:path"

import { fileURLToPath } from "node:url"

import bcrypt from "bcryptjs"

import express from "express"

import jwt from "jsonwebtoken"

const app = express()

const port = Number(process.env.API_PORT || 3001)

const jwtSecret =
  process.env.JWT_SECRET ||
  "careconnect-local-development-secret-change-before-deploying"

const dataDirectory = path.resolve(
  process.env.DATA_DIRECTORY ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data"),
)

const dataFile = path.join(dataDirectory, "careconnect.json")

const isProduction = process.env.NODE_ENV === "production"

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured before running in production.")
}

const doctors = [
  {
    id: 1,
    name: "Dr. Meera Nair",
    specialty: "Cardiology",
    hospital: "Apollo Heart Institute, Chennai",
    rating: 4.9,
    reviews: 284,
    photo:
      "https://images.pexels.com/photos/36665076/pexels-photo-36665076.jpeg?auto=compress&cs=tinysrgb&w=1000",
    experience: 12,
    consultType: "both",
    fee: 1200,
    bio: "Cardiologist focused on preventive heart care and helping patients build healthier lives.",
    languages: ["English", "Hindi", "Malayalam"],
    education: "DM Cardiology, AIIMS New Delhi",
    nextAvailable: "Today, 2:30 PM IST",
    available: ["Today", "Tomorrow"],
  },

  {
    id: 2,
    name: "Dr. Arjun Sharma",
    specialty: "General Practice",
    hospital: "CareConnect Family Clinic, Mumbai",
    rating: 4.8,
    reviews: 196,
    photo:
      "https://images.pexels.com/photos/19438563/pexels-photo-19438563/free-photo-of-doctor.jpeg?auto=compress&cs=tinysrgb&w=1000",
    experience: 15,
    consultType: "both",
    fee: 499,
    bio: "Family physician providing thoughtful, comprehensive care for adults and families.",
    languages: ["English", "Hindi", "Punjabi"],
    education: "MBBS, MD, AIIMS New Delhi",
    nextAvailable: "Today, 3:00 PM IST",
    available: ["Today", "Tomorrow"],
  },

  {
    id: 3,
    name: "Dr. Aisha Khan",
    specialty: "Neurology",
    hospital: "Fortis Memorial Research Institute, Gurugram",
    rating: 4.9,
    reviews: 172,
    photo:
      "https://images.pexels.com/photos/5738735/pexels-photo-5738735.jpeg?auto=compress&cs=tinysrgb&w=1000",
    experience: 10,
    consultType: "virtual",
    fee: 1499,
    bio: "Neurologist specializing in migraine care, sleep health, and evidence-based treatment plans.",
    languages: ["English", "Hindi", "Urdu"],
    education: "DM Neurology, NIMHANS Bengaluru",
    nextAvailable: "Tomorrow, 9:00 AM IST",
    available: ["Tomorrow", "Friday"],
  },

  {
    id: 4,
    name: "Dr. Kavita Iyer",
    specialty: "Orthopedics",
    hospital: "Manipal Hospitals, Bengaluru",
    rating: 4.7,
    reviews: 143,
    photo:
      "https://images.pexels.com/photos/10695742/pexels-photo-10695742.jpeg?auto=compress&cs=tinysrgb&w=1000",
    experience: 14,
    consultType: "in-person",
    fee: 899,
    bio: "Orthopedic specialist helping patients recover mobility through personalized treatment and rehabilitation.",
    languages: ["English", "Hindi", "Tamil"],
    education: "MS Orthopaedics, CMC Vellore",
    nextAvailable: "Wednesday, 10:00 AM IST",
    available: ["Wednesday", "Thursday"],
  },

  {
    id: 5,
    name: "Dr. Rohan Mehta",
    specialty: "Dermatology",
    hospital: "Apollo Hospitals, Ahmedabad",
    rating: 4.8,
    reviews: 208,
    photo:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1000&fit=crop&auto=format",
    experience: 9,
    consultType: "both",
    fee: 699,
    bio: "Dermatologist offering compassionate care for skin health, routine screenings, and common conditions.",
    languages: ["English", "Hindi", "Gujarati"],
    education: "MD Dermatology, KEM Hospital Mumbai",
    nextAvailable: "Thursday, 11:30 AM IST",
    available: ["Thursday", "Friday"],
  },

  {
    id: 6,
    name: "Dr. Priya Menon",
    specialty: "Psychiatry",
    hospital: "NIMHANS Centre for Wellbeing, Bengaluru",
    rating: 4.9,
    reviews: 131,
    photo:
      "https://images.unsplash.com/photo-1659353888906-adb3e0041693?w=1000&fit=crop&auto=format",
    experience: 11,
    consultType: "virtual",
    fee: 1299,
    bio: "Psychiatrist supporting adults with a collaborative, patient-centered approach to mental wellness.",
    languages: ["English", "Hindi", "Malayalam"],
    education: "MD Psychiatry, NIMHANS Bengaluru",
    nextAvailable: "Friday, 1:00 PM IST",
    available: ["Friday", "Monday"],
  },
]

const sampleRecords = {
  vitals: {
    bloodPressure: "118/76",
    heartRate: 72,
    bloodGlucose: 92,
    bmi: 22.4,
    cholesterol: 168,
    oxygenSat: 98,
    weight: "68 kg",
    height: "175 cm",
    updatedAt: new Date().toISOString().slice(0, 10),
  },

  conditions: [],

  allergies: [],

  medications: [],

  labs: [],
}

let database

let saveQueue = Promise.resolve()

const eventClients = new Map()

function newDatabase() {
  return {
    users: [],
    appointments: [],
    payments: [],
    messages: [],
    notifications: [],
    otpChallenges: [],
  }
}

async function persist() {
  saveQueue = saveQueue.then(async () => {
    await mkdir(dataDirectory, { recursive: true })

    const temporaryFile = `${dataFile}.${process.pid}.tmp`

    await writeFile(temporaryFile, JSON.stringify(database, null, 2), "utf8")

    await rename(temporaryFile, dataFile)
  })

  return saveQueue
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user

  return safeUser
}

function createToken(user) {
  return jwt.sign({ sub: String(user.id) }, jwtSecret, { expiresIn: "7d" })
}

function addNotification(userId, type, title, message) {
  const now = new Date()

  database.notifications.unshift({
    id: randomUUID(),

    userId,

    type,

    title,

    message,

    time: now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),

    read: false,

    createdAt: now.toISOString(),
  })
}

function sendEvent(userId, event) {
  const clients = eventClients.get(userId)

  if (!clients) return

  const payload = `data: ${JSON.stringify(event)}\n\n`

  for (const response of clients) response.write(payload)
}

function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || ""

  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : ""

  try {
    const payload = jwt.verify(token, jwtSecret)

    req.userId = Number(payload.sub)

    if (!database.users.some((user) => user.id === req.userId)) {
      return res.status(401).json({
        error: "Your session is no longer valid. Please sign in again.",
      })
    }

    next()
  } catch {
    res.status(401).json({ error: "Please sign in to continue." })
  }
}

function requireEventAuth(req, res, next) {
  const token = typeof req.query.token === "string" ? req.query.token : ""

  try {
    const payload = jwt.verify(token, jwtSecret)

    req.userId = Number(payload.sub)

    if (!database.users.some((user) => user.id === req.userId)) {
      return res.status(401).end()
    }

    next()
  } catch {
    res.status(401).end()
  }
}

function fail(res, status, message) {
  return res.status(status).json({ error: message })
}

function userAppointments(userId) {
  return database.appointments

    .filter((appointment) => appointment.userId === userId)

    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))

    .map(({ userId: _userId, otpCode: _otpCode, ...appointment }) => ({
      ...appointment,
      photo: doctors.find((doctor) => doctor.id === appointment.doctorId).photo,
    }))
}

function isFutureOrTodayDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false

  const [year, month, day] = value.split("-").map(Number)

  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return false

  const today = new Date()

  today.setHours(0, 0, 0, 0)

  return date >= today
}

function isValidCardNumber(value) {
  const digits = value.replace(/\D/g, "")

  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0

  let doubleDigit = false

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i])

    if (doubleDigit) {
      digit *= 2

      if (digit > 9) digit -= 9
    }

    sum += digit

    doubleDigit = !doubleDigit
  }

  return sum % 10 === 0
}

function cardBrand(digits) {
  if (digits.startsWith("4")) return "Visa"

  if (/^5[1-5]/.test(digits)) return "Mastercard"

  if (/^3[47]/.test(digits)) return "Amex"

  return "Card"
}

await mkdir(dataDirectory, { recursive: true })

try {
  database = JSON.parse(await readFile(dataFile, "utf8"))

  for (const key of Object.keys(newDatabase())) {
    if (!Array.isArray(database[key])) database[key] = []
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error

  database = newDatabase()
}

if (!database.users.some((user) => user.email === "demo@careconnect.app")) {
  database.users.push({
    id: 1,

    name: "Alex Morgan",

    email: "demo@careconnect.app",

    passwordHash: await bcrypt.hash("demo1234", 10),

    phone: "",

    dob: "",

    bloodType: "O+",

    patientId: "CC-100001",

    gender: "",

    address: "",

    emergencyContact: "",

    createdAt: new Date().toISOString(),
  })

  await persist()
}

app.disable("x-powered-by")

app.use(express.json({ limit: "32kb" }))

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")

  next()
})

app.get("/api/health", (_req, res) => res.json({ status: "ok" }))

app.post("/api/auth/register", async (req, res) => {
  const {
    name,
    email,
    password,
    phone = "",
    dob = "",
    gender = "",
  } = req.body || {}

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100
  )
    return fail(res, 400, "Please enter your full name.")

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  )
    return fail(res, 400, "Please enter a valid email address.")

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  )
    return fail(res, 400, "Password must be between 8 and 128 characters.")

  const normalizedEmail = email.trim().toLowerCase()

  if (database.users.some((user) => user.email === normalizedEmail))
    return fail(res, 409, "An account with this email already exists.")

  const user = {
    id: Math.max(0, ...database.users.map((existing) => existing.id)) + 1,

    name: name.trim(),

    email: normalizedEmail,

    passwordHash: await bcrypt.hash(password, 12),

    phone: typeof phone === "string" ? phone.trim().slice(0, 30) : "",

    dob: typeof dob === "string" ? dob.slice(0, 10) : "",

    gender: typeof gender === "string" ? gender.slice(0, 40) : "",

    bloodType: "",

    patientId: `CC-${String(Date.now()).slice(-6)}`,

    address: "",

    emergencyContact: "",

    createdAt: new Date().toISOString(),
  }

  database.users.push(user)

  await persist()

  res.status(201).json({ token: createToken(user), user: publicUser(user) })
})

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {}

  if (typeof email !== "string" || typeof password !== "string")
    return fail(res, 400, "Enter your email and password.")

  const user = database.users.find(
    (candidate) => candidate.email === email.trim().toLowerCase(),
  )

  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return fail(res, 401, "Email or password is incorrect.")

  res.json({ token: createToken(user), user: publicUser(user) })
})

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = database.users.find((candidate) => candidate.id === req.userId)

  res.json(publicUser(user))
})

app.get("/api/doctors", (req, res) => {
  const specialty =
    typeof req.query.specialty === "string"
      ? req.query.specialty.toLowerCase()
      : ""

  const query =
    typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : ""

  const filtered = doctors.filter((doctor) => {
    const matchesSpecialty =
      !specialty || doctor.specialty.toLowerCase() === specialty

    const matchesQuery =
      !query ||
      [doctor.name, doctor.specialty, doctor.hospital].some((value) =>
        value.toLowerCase().includes(query),
      )

    return matchesSpecialty && matchesQuery
  })

  res.json(filtered)
})

app.get("/api/doctors/:id", (req, res) => {
  const doctor = doctors.find((item) => item.id === Number(req.params.id))

  if (!doctor) return fail(res, 404, "Doctor not found.")

  res.json(doctor)
})

app.get("/api/appointments", requireAuth, (req, res) =>
  res.json(userAppointments(req.userId)),
)

app.post("/api/appointments", requireAuth, async (req, res) => {
  const {
    doctorId,
    date,
    time,
    type,
    notes = "",
    paymentId = "",
  } = req.body || {}

  const doctor = doctors.find((item) => item.id === Number(doctorId))

  if (!doctor) return fail(res, 404, "Please select an available doctor.")

  if (!isFutureOrTodayDate(date))
    return fail(res, 400, "Choose a valid appointment date.")

  if (typeof time !== "string" || time.length > 20)
    return fail(res, 400, "Choose an appointment time.")

  if (
    !["In-Person", "Virtual"].includes(type) ||
    (type === "In-Person" && doctor.consultType === "virtual") ||
    (type === "Virtual" && doctor.consultType === "in-person")
  )
    return fail(
      res,
      400,
      "This visit type is not available for the selected doctor.",
    )

  if (typeof notes !== "string" || notes.length > 1000)
    return fail(
      res,
      400,
      "Appointment notes must be 1,000 characters or fewer.",
    )

  if (
    database.appointments.some(
      (item) =>
        item.doctorId === doctor.id &&
        item.date === date &&
        item.time === time &&
        ["upcoming", "pending_verification"].includes(item.status),
    )
  )
    return fail(
      res,
      409,
      "This time was just booked. Please choose another time.",
    )

  const payment = paymentId
    ? database.payments.find(
        (item) =>
          item.id === paymentId &&
          item.userId === req.userId &&
          item.doctorId === doctor.id,
      )
    : null

  if (paymentId && !payment)
    return fail(
      res,
      400,
      "The payment could not be verified. Please try again.",
    )

  const appointment = {
    id: Math.max(0, ...database.appointments.map((item) => item.id)) + 1,

    userId: req.userId,

    doctorId: doctor.id,

    doctor: doctor.name,

    specialty: doctor.specialty,

    date,

    time,

    type,

    status: "pending_verification",

    location: type === "Virtual" ? "Secure video visit" : doctor.hospital,

    notes: notes.trim(),

    fee: doctor.fee + 49,

    paymentStatus: payment ? "authorized" : "unpaid",

    paymentId: payment?.id || "",

    createdAt: new Date().toISOString(),
  }

  database.appointments.push(appointment)

  if (payment) payment.appointmentId = appointment.id

  await persist()

  res
    .status(201)
    .json(
      userAppointments(req.userId).find((item) => item.id === appointment.id),
    )
})

app.put("/api/appointments/:id/cancel", requireAuth, async (req, res) => {
  const appointment = database.appointments.find(
    (item) => item.id === Number(req.params.id) && item.userId === req.userId,
  )

  if (!appointment) return fail(res, 404, "Appointment not found.")

  if (!["upcoming", "pending_verification"].includes(appointment.status))
    return fail(res, 409, "This appointment can no longer be cancelled.")

  appointment.status = "cancelled"

  appointment.paymentStatus =
    appointment.paymentStatus === "authorized"
      ? "refund_pending"
      : appointment.paymentStatus

  addNotification(
    req.userId,
    "cancelled",
    "Appointment cancelled",
    `Your appointment with ${appointment.doctor} on ${appointment.date} was cancelled.`,
  )

  await persist()

  sendEvent(req.userId, {
    type: "appointment.updated",
    appointmentId: appointment.id,
  })

  res.json(
    userAppointments(req.userId).find((item) => item.id === appointment.id),
  )
})

app.put("/api/appointments/:id/reschedule", requireAuth, async (req, res) => {
  const appointment = database.appointments.find(
    (item) => item.id === Number(req.params.id) && item.userId === req.userId,
  )

  const { date, time } = req.body || {}

  if (!appointment) return fail(res, 404, "Appointment not found.")

  if (appointment.status !== "upcoming")
    return fail(res, 409, "Only confirmed appointments can be rescheduled.")

  if (
    !isFutureOrTodayDate(date) ||
    typeof time !== "string" ||
    time.length > 20
  )
    return fail(res, 400, "Choose a valid date and time.")

  if (
    database.appointments.some(
      (item) =>
        item.id !== appointment.id &&
        item.doctorId === appointment.doctorId &&
        item.date === date &&
        item.time === time &&
        ["upcoming", "pending_verification"].includes(item.status),
    )
  )
    return fail(res, 409, "This time is no longer available.")

  appointment.date = date

  appointment.time = time

  await persist()

  sendEvent(req.userId, {
    type: "appointment.updated",
    appointmentId: appointment.id,
  })

  res.json(
    userAppointments(req.userId).find((item) => item.id === appointment.id),
  )
})

app.post("/api/appointments/:id/otp", requireAuth, async (req, res) => {
  const appointment = database.appointments.find(
    (item) => item.id === Number(req.params.id) && item.userId === req.userId,
  )

  if (!appointment) return fail(res, 404, "Appointment not found.")

  if (appointment.status !== "pending_verification")
    return fail(res, 409, "This appointment does not need verification.")

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  database.otpChallenges = database.otpChallenges.filter(
    (challenge) => challenge.appointmentId !== appointment.id,
  )

  database.otpChallenges.push({
    appointmentId: appointment.id,
    userId: req.userId,
    code,
    expiresAt,
    attempts: 0,
  })

  await persist()

  res.json({
  message: "Enter the verification code to confirm your appointment.",
  expiresAt,
  developmentCode: code,
})

app.post("/api/appointments/:id/verify-otp", requireAuth, async (req, res) => {
  const appointment = database.appointments.find(
    (item) => item.id === Number(req.params.id) && item.userId === req.userId,
  )

  const challenge = database.otpChallenges.find(
    (item) =>
      item.appointmentId === Number(req.params.id) &&
      item.userId === req.userId,
  )

  const { code } = req.body || {}

  if (!appointment || !challenge)
    return fail(res, 404, "Verification code not found. Request a new code.")

  if (Date.now() > Date.parse(challenge.expiresAt))
    return fail(res, 410, "Your code has expired. Request a new one.")

  if (challenge.attempts >= 5)
    return fail(res, 429, "Too many incorrect codes. Request a new one.")

  if (
    typeof code !== "string" ||
    !/^\d{6}$/.test(code) ||
    code !== challenge.code
  ) {
    challenge.attempts += 1

    await persist()

    return fail(res, 400, "That code is incorrect. Please try again.")
  }

  appointment.status = "upcoming"

  appointment.paymentStatus = appointment.paymentId ? "paid" : "unpaid"

  database.otpChallenges = database.otpChallenges.filter(
    (item) => item.appointmentId !== appointment.id,
  )

  addNotification(
    req.userId,
    "confirmed",
    "Appointment confirmed",
    `Your appointment with ${appointment.doctor} on ${appointment.date} is confirmed.`,
  )

  await persist()

  sendEvent(req.userId, {
    type: "appointment.updated",
    appointmentId: appointment.id,
  })

  res.json(
    userAppointments(req.userId).find((item) => item.id === appointment.id),
  )
})

app.post("/api/payments/process", requireAuth, async (req, res) => {
  const {
    cardNumber,
    cardName,
    expiry,
    cvv,
    amount,
    doctorId,
    appointmentType,
  } = req.body || {}

  const doctor = doctors.find((item) => item.id === Number(doctorId))

  const digits =
    typeof cardNumber === "string" ? cardNumber.replace(/\D/g, "") : ""

  const expiryMatch =
    typeof expiry === "string"
      ? expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/)
      : null

  if (!isValidCardNumber(digits))
    return fail(
      res,
      400,
      "Enter a valid card number (test card: 4242 4242 4242 4242).",
    )

  if (
    typeof cardName !== "string" ||
    cardName.trim().length < 2 ||
    cardName.length > 100
  )
    return fail(res, 400, "Enter the cardholder name.")

  if (!expiryMatch)
    return fail(res, 400, "Enter a valid expiry date in MM/YY format.")

  const expiryMonth = Number(expiryMatch[1])

  const expiryYear = 2000 + Number(expiryMatch[2])

  const expiryDate = new Date(expiryYear, expiryMonth)

  if (expiryDate <= new Date(new Date().getFullYear(), new Date().getMonth()))
    return fail(res, 400, "This card has expired.")

  if (typeof cvv !== "string" || !/^\d{3,4}$/.test(cvv))
    return fail(res, 400, "Enter a valid card security code.")

  if (!doctor || !["In-Person", "Virtual"].includes(appointmentType))
    return fail(res, 400, "Choose a valid doctor and appointment type.")

  const expectedAmount = doctor.fee + 49

  if (Number(amount) !== expectedAmount)
    return fail(
      res,
      400,
      "The payment amount does not match the consultation fee.",
    )

  const payment = {
    id: `CC-${randomUUID().slice(0, 8).toUpperCase()}`,

    userId: req.userId,

    doctorId: doctor.id,

    amount: expectedAmount,

    consultationFee: doctor.fee,

    platformFee: 49,

    status: "authorized",

    last4: digits.slice(-4),

    brand: cardBrand(digits),

    cardName: cardName.trim(),

    createdAt: new Date().toISOString(),
  }

  database.payments.push(payment)

  await persist()

  const { userId: _userId, ...publicPayment } = payment

  res.status(201).json(publicPayment)
})

app.get("/api/payments", requireAuth, (req, res) => {
  res.json(
    database.payments
      .filter((payment) => payment.userId === req.userId)
      .map(({ userId: _userId, ...payment }) => payment),
  )
})

app.get("/api/records", requireAuth, (req, res) => {
  const visits = userAppointments(req.userId)
    .filter((appointment) => appointment.status === "completed")
    .map((appointment) => ({
      id: String(appointment.id),

      name: `${appointment.specialty} consultation`,

      date: appointment.date,

      status: "Complete",

      doctor: appointment.doctor,

      result:
        appointment.notes || "Visit summary available from your care team.",
    }))

  res.json({ ...sampleRecords, labs: [...sampleRecords.labs, ...visits] })
})

app.get("/api/messages", requireAuth, (req, res) => {
  const userThreads = database.messages.filter(
    (thread) => thread.userId === req.userId,
  )

  const threads = userThreads.map(({ userId: _userId, ...thread }) => ({
    ...thread,
    photo: doctors.find((doctor) => doctor.id === thread.doctorId).photo,
  }))

  for (const doctor of doctors) {
    if (!threads.some((thread) => thread.doctorId === doctor.id)) {
      threads.push({
        threadId: `${req.userId}-${doctor.id}`,

        doctorId: doctor.id,

        doctorName: doctor.name,

        photo: doctor.photo,

        unread: 0,

        messages: [],
      })
    }
  }

  res.json(threads)
})

app.post("/api/messages/send", requireAuth, async (req, res) => {
  const { doctorId, text } = req.body || {}

  const doctor = doctors.find((item) => item.id === Number(doctorId))

  if (!doctor) return fail(res, 404, "Doctor not found.")

  if (typeof text !== "string" || !text.trim() || text.trim().length > 2000)
    return fail(res, 400, "Messages must contain 1–2,000 characters.")

  let thread = database.messages.find(
    (item) => item.userId === req.userId && item.doctorId === doctor.id,
  )

  if (!thread) {
    thread = {
      userId: req.userId,
      threadId: `${req.userId}-${doctor.id}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      photo: doctor.photo,
      unread: 0,
      messages: [],
    }

    database.messages.push(thread)
  }

  const now = new Date()

  const message = {
    id: randomUUID(),

    from: "patient",

    text: text.trim(),

    time: now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
    }),

    date: now.toISOString().slice(0, 10),
  }

  thread.messages.push(message)

  await persist()

  res.status(201).json(message)
})

app.get("/api/notifications", requireAuth, (req, res) => {
  res.json(
    database.notifications
      .filter((notification) => notification.userId === req.userId)
      .map(({ userId: _userId, ...notification }) => notification),
  )
})

app.put("/api/notifications/read-all", requireAuth, async (req, res) => {
  for (const notification of database.notifications) {
    if (notification.userId === req.userId) notification.read = true
  }

  await persist()

  res.json({ success: true })
})

app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
  const notification = database.notifications.find(
    (item) => item.id === req.params.id && item.userId === req.userId,
  )

  if (!notification) return fail(res, 404, "Notification not found.")

  notification.read = true

  await persist()

  res.json({ success: true })
})

app.get("/api/events", requireEventAuth, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  })

  res.flushHeaders()

  res.write("retry: 5000\n\n")

  const clients = eventClients.get(req.userId) || new Set()

  clients.add(res)

  eventClients.set(req.userId, clients)

  req.on("close", () => {
    clients.delete(res)

    if (clients.size === 0) eventClients.delete(req.userId)
  })
})

app.use("/api", (_req, res) => fail(res, 404, "API endpoint not found."))

if (isProduction) {
  const distDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "dist",
  )

  app.use(express.static(distDirectory))

  app.get("*path", (_req, res) =>
    res.sendFile(path.join(distDirectory, "index.html")),
  )
}

app.listen(port, () => {
  console.log(`CareConnect API listening on http://localhost:${port}`)

  if (!isProduction)
    console.log("Demo sign-in: demo@careconnect.app / demo1234")
})
