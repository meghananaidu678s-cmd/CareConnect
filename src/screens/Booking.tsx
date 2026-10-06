import { useState, useEffect } from "react"
import { useNav } from "../nav"
import { api, type Doctor } from "../api"
import { formatINR } from "../format"

const SPECIALTIES = [
  {
    name: "General Practice",
    icon: "🏥",
    color: "#EEF2FF",
    iconColor: "#4F46E5",
  },
  { name: "Cardiology", icon: "🫀", color: "#FEF2F2", iconColor: "#DC2626" },
  { name: "Neurology", icon: "🧠", color: "#F5F3FF", iconColor: "#7C3AED" },
  { name: "Orthopedics", icon: "🦴", color: "#FFF7ED", iconColor: "#EA580C" },
  { name: "Dermatology", icon: "🧴", color: "#ECFDF5", iconColor: "#059669" },
  { name: "Psychiatry", icon: "🧘", color: "#EFF6FF", iconColor: "#2563EB" },
]

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const TIME_SLOTS = [
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
]

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function BookingScreen() {
  const { push } = useNav()
  const [step, setStep] = useState(1)
  const [specialty, setSpecialty] = useState("")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(false)

  // Calendar
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selDay, setSelDay] = useState<number | null>(null)
  const [selTime, setSelTime] = useState<string | null>(null)

  // Details
  const [apptType, setApptType] = useState<"In-Person" | "Virtual">("In-Person")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!specialty) return
    setLoading(true)
    api.doctors
      .list({ specialty })
      .then((d) => setDoctors(d))
      .finally(() => setLoading(false))
  }, [specialty])

  const calCells = buildCalendar(calYear, calMonth)

  function prevMonth() {
    if (calMonth === 0) {
      setCalYear((y) => y - 1)
      setCalMonth(11)
    } else setCalMonth((m) => m - 1)
    setSelDay(null)
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalYear((y) => y + 1)
      setCalMonth(0)
    } else setCalMonth((m) => m + 1)
    setSelDay(null)
  }

  function isDisabled(day: number) {
    const d = new Date(calYear, calMonth, day)
    d.setHours(0, 0, 0, 0)
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return d < t
  }

  function selDateStr() {
    if (!selDay) return ""
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selDay).padStart(2, "0")}`
  }

  function handleProceedToPayment() {
    if (!doctor || !selDay || !selTime) return
    push({
      name: "payment",
      params: {
        doctor,
        date: selDateStr(),
        time: selTime,
        type: apptType,
        notes,
      },
    })
  }

  const steps = ["Specialty", "Doctor", "Date & Time", "Details"]

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 text-sm font-medium mb-3"
            style={{ color: "var(--primary)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        )}
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          Book Appointment
        </h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-3">
          {steps.map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-2 flex-1 last:flex-none"
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background:
                      step > i + 1
                        ? "var(--accent)"
                        : step === i + 1
                          ? "var(--primary)"
                          : "#E5E7EB",
                    color: step >= i + 1 ? "white" : "#9CA3AF",
                  }}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 rounded-full"
                  style={{
                    background: step > i + 1 ? "var(--accent)" : "#E5E7EB",
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{steps[step - 1]}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {/* Step 1: Specialty */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              What type of doctor are you looking for?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTIES.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    setSpecialty(s.name)
                    setStep(2)
                  }}
                  className="flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-98"
                  style={{
                    borderColor:
                      specialty === s.name ? "var(--primary)" : "transparent",
                    background: s.color,
                  }}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: s.iconColor }}
                  >
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Doctor */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{specialty} specialists</p>
              <span className="text-xs text-gray-400">
                {doctors.length} available
              </span>
            </div>
            {loading ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Loading doctors…
              </div>
            ) : (
              doctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setDoctor(doc)
                    setStep(3)
                  }}
                  className={`w-full bg-white rounded-2xl border-2 p-4 text-left transition-all active:scale-98 ${
                    doctor?.id === doc.id
                      ? "border-teal-500"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={doc.photo}
                        alt={doc.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-400">{doc.hospital}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${
                                i <= Math.floor(doc.rating)
                                  ? "text-amber-400"
                                  : "text-gray-200"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 font-mono-data">
                          {doc.rating} ({doc.reviews})
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="font-display text-lg font-bold"
                        style={{ color: "var(--primary)" }}
                      >
                        {formatINR(doc.fee)}
                      </p>
                      <p className="text-xs text-gray-400">per visit</p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${
                          doc.consultType === "virtual"
                            ? "bg-emerald-50 text-emerald-700"
                            : doc.consultType === "both"
                              ? "bg-teal-50 text-teal-700"
                              : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {doc.consultType === "both"
                          ? "Both"
                          : doc.consultType === "virtual"
                            ? "🎥 Virtual"
                            : "🏥 In-Person"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {doc.experience}y experience
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--accent)" }}
                    >
                      Next: {doc.nextAvailable}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-semibold">
                  {MONTHS[calMonth]} {calYear}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium text-gray-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calCells.map((day, i) => {
                  if (!day) return <div key={i} />
                  const disabled = isDisabled(day)
                  const isToday =
                    day === today.getDate() &&
                    calMonth === today.getMonth() &&
                    calYear === today.getFullYear()
                  const isSelected =
                    day === selDay && calMonth === today.getMonth()
                  return (
                    <button
                      key={i}
                      onClick={() => !disabled && setSelDay(day)}
                      disabled={disabled}
                      className={`w-full aspect-square rounded-full text-xs font-medium transition-all flex items-center justify-center ${
                        isSelected
                          ? "text-white"
                          : isToday
                            ? "font-bold"
                            : disabled
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-gray-100"
                      }`}
                      style={{
                        background: isSelected
                          ? "var(--primary)"
                          : "transparent",
                        color: isSelected
                          ? "white"
                          : isToday
                            ? "var(--primary)"
                            : disabled
                              ? "#9CA3AF"
                              : "#374151",
                        outline:
                          isToday && !isSelected
                            ? "1.5px solid var(--primary)"
                            : "none",
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selDay && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Available times
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelTime(t)}
                      className={`py-2.5 rounded-xl text-xs font-mono-data font-medium border transition-all ${
                        selTime === t
                          ? "text-white border-transparent"
                          : "border-gray-200 bg-white text-gray-600 hover:border-teal-300"
                      }`}
                      style={
                        selTime === t ? { background: "var(--primary)" } : {}
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selDay && selTime && (
              <button
                onClick={() => setStep(4)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                Continue →
              </button>
            )}
          </div>
        )}

        {/* Step 4: Details */}
        {step === 4 && doctor && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <img
                  src={doctor.photo}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{doctor.name}</p>
                <p className="text-xs text-gray-400">{doctor.specialty}</p>
                <p
                  className="font-mono-data text-xs mt-0.5"
                  style={{ color: "var(--primary)" }}
                >
                  {selDateStr()} · {selTime}
                </p>
              </div>
              <p
                className="font-display text-xl font-bold shrink-0"
                style={{ color: "var(--primary)" }}
              >
                {formatINR(doctor.fee)}
              </p>
            </div>

            {/* Appointment type */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Appointment Type
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["In-Person", "Virtual"] as const)
                  .filter(
                    (t) =>
                      doctor.consultType === "both" ||
                      (doctor.consultType === "in-person" &&
                        t === "In-Person") ||
                      (doctor.consultType === "virtual" && t === "Virtual"),
                  )
                  .map((t) => (
                    <button
                      key={t}
                      onClick={() => setApptType(t)}
                      className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 transition-all ${
                        apptType === t ? "" : "border-gray-100 bg-white"
                      }`}
                      style={
                        apptType === t
                          ? {
                              borderColor: "var(--primary)",
                              background: "#EBF5F7",
                            }
                          : {}
                      }
                    >
                      <span className="text-xl">
                        {t === "Virtual" ? "🎥" : "🏥"}
                      </span>
                      <div className="text-left">
                        <p
                          className="text-xs font-bold"
                          style={{
                            color:
                              apptType === t ? "var(--primary)" : "#374151",
                          }}
                        >
                          {t}
                        </p>
                        <p className="text-xs text-gray-400">
                          {t === "Virtual" ? "Video call" : doctor.hospital}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Reason for Visit
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Briefly describe your symptoms or reason for the appointment…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm resize-none focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>

            {/* Fee breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Consultation fee</span>
                <span className="font-medium">{formatINR(doctor.fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform fee</span>
                <span className="font-medium">{formatINR(49)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-1">
                <span>Total</span>
                <span style={{ color: "var(--primary)" }}>
                  {formatINR(doctor.fee + 49)}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white shadow-lg shadow-teal-200"
              style={{ background: "var(--primary)" }}
            >
              Proceed to Payment · {formatINR(doctor.fee + 49)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
