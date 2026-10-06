import { useState } from "react"
import { useNav } from "../nav"
import { useApp } from "../context"
import { api, type Doctor } from "../api"
import { formatINR, formatIndiaDate } from "../format"

function formatCardNumber(val: string) {
  return val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})/g, "$1 ")
    .trim()
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2)
  return digits
}

function detectBrand(num: string) {
  const d = num.replace(/\s/g, "")
  if (d.startsWith("4")) return "Visa"
  if (d.startsWith("5")) return "Mastercard"
  if (d.startsWith("3")) return "Amex"
  return "Card"
}

function brandGradient(brand: string) {
  if (brand === "Visa")
    return "linear-gradient(135deg, #1A4A8C 0%, #2563EB 50%, #0D6375 100%)"
  if (brand === "Mastercard")
    return "linear-gradient(135deg, #831843 0%, #BE185D 50%, #7C2D12 100%)"
  if (brand === "Amex")
    return "linear-gradient(135deg, #064E3B 0%, #059669 100%)"
  return "linear-gradient(135deg, #0A6375 0%, #12A882 100%)"
}

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return formatIndiaDate(d, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface PaymentScreenProps {
  params?: {
    doctor: Doctor
    date: string
    time: string
    type: "In-Person" | "Virtual"
    notes: string
  }
}

export function PaymentScreen({ params }: PaymentScreenProps) {
  const { pop, reset } = useNav()
  const { refreshAppointments } = useApp()

  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [flipped, setFlipped] = useState(false)

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [verification, setVerification] = useState<{
    appointmentId: number
    developmentCode?: string
  } | null>(null)
  const [otp, setOtp] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState<{
    paymentId: string
    brand: string
    last4: string
  } | null>(null)

  const brand = detectBrand(cardNumber)
  const displayNumber = cardNumber || "•••• •••• •••• ••••"
  const displayName = cardName || "CARDHOLDER NAME"
  const displayExpiry = expiry || "MM/YY"

  const doctor = params?.doctor
  const total = doctor ? doctor.fee + 49 : 0

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!doctor || !params) return
    if (cardNumber.replace(/\s/g, "").length < 13)
      return setError("Please enter a valid card number")
    if (!cardName.trim()) return setError("Please enter the cardholder name")
    if (expiry.length < 4) return setError("Please enter a valid expiry date")
    if (cvv.length < 3) return setError("Please enter a valid CVV")

    setError("")
    setProcessing(true)
    try {
      // Process payment
      const payment = await api.payments.process({
        cardNumber,
        cardName,
        expiry,
        cvv,
        amount: total,
        doctorId: doctor.id,
        appointmentType: params.type,
      })

      // Create appointment
      const appointment = await api.appointments.create({
        doctorId: doctor.id,
        date: params.date,
        time: params.time,
        type: params.type,
        notes: params.notes,
        paymentId: payment.id,
      })
      const otpResponse = await api.appointments.requestOtp(appointment.id)
      setVerification({
        appointmentId: appointment.id,
        developmentCode: otpResponse.developmentCode,
      })
      setSuccess({
        paymentId: payment.id,
        brand: payment.brand,
        last4: payment.last4,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!verification) return
    setError("")
    setVerifying(true)
    try {
      await api.appointments.verifyOtp(verification.appointmentId, otp)
      await refreshAppointments()
      setVerification(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  if (verification && success) {
    return (
      <div className="flex flex-col min-h-full px-6 py-8">
        <div className="flex-1 flex flex-col justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "#EBF5F7", color: "var(--primary)" }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Verify your appointment
          </h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            We sent a 6-digit code to your registered phone before confirming
            the booking.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoFocus
              placeholder="000000"
              className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white text-center text-2xl tracking-[0.45em] font-mono-data focus:border-teal-500"
              aria-label="Appointment verification code"
            />
            {verification.developmentCode && (
              <p className="text-xs text-center text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                Development code:{" "}
                <strong>{verification.developmentCode}</strong>
              </p>
            )}
            <button
              disabled={verifying || otp.length !== 6}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {verifying ? "Verifying…" : "Verify and confirm"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400">
          Payment {success.paymentId} is authorized and will remain protected
          until verification.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 text-center py-8">
        <div className="relative mb-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #059669, #12A882)" }}
          >
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm">
            🎉
          </div>
        </div>
        <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">
          Booking Confirmed!
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Your appointment has been successfully booked and payment processed.
        </p>

        <div className="w-full bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-6 shadow-sm text-left">
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Appointment Details
            </p>
            {[
              { label: "Doctor", val: doctor?.name },
              { label: "Specialty", val: doctor?.specialty },
              {
                label: "Date",
                val: params ? formatDateDisplay(params.date) : "",
              },
              { label: "Time", val: params?.time },
              { label: "Type", val: params?.type },
            ].map((r) => (
              <div key={r.label} className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500">{r.label}</span>
                <span className="text-sm font-medium">{r.val}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Payment Receipt
            </p>
            {[
              { label: "Amount Paid", val: formatINR(total) },
              {
                label: "Payment Method",
                val: `${success.brand} ••••${success.last4}`,
              },
              { label: "Transaction ID", val: success.paymentId },
              { label: "Status", val: "✅ Successful" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500">{r.label}</span>
                <span className="text-sm font-medium font-mono-data">
                  {r.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => reset({ name: "appointments" })}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            View Appointments
          </button>
          <button
            onClick={() => reset({ name: "home" })}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-gray-100 text-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
        <button
          onClick={pop}
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
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          Payment
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Complete your appointment booking
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 space-y-5">
        {/* Appointment summary */}
        {doctor && params && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#EBF5F7" }}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img
                src={doctor.photo}
                alt={doctor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">
                {doctor.name}
              </p>
              <p className="text-xs text-gray-500">
                {params.type} · {formatDateDisplay(params.date)} · {params.time}
              </p>
            </div>
            <p
              className="font-display text-xl font-bold shrink-0"
              style={{ color: "var(--primary)" }}
            >
              {formatINR(total)}
            </p>
          </div>
        )}

        {/* 3D Credit Card */}
        <div className="card-perspective">
          <div className={`card-inner ${flipped ? "flipped" : ""}`}>
            {/* Front */}
            <div
              className="card-face card-front rounded-2xl p-5 shadow-xl"
              style={{ background: brandGradient(brand) }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full opacity-80"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  />
                  <div
                    className="w-5 h-5 rounded-full opacity-60"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  />
                </div>
                <div className="w-10 h-7 rounded bg-yellow-400/80 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-px">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-sm bg-yellow-700/60"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-5">
                <p className="font-mono-data text-white text-lg tracking-widest leading-none">
                  {displayNumber}
                </p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                    Cardholder
                  </p>
                  <p className="font-mono-data text-white text-sm tracking-wider uppercase">
                    {displayName}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                    Expires
                  </p>
                  <p className="font-mono-data text-white text-sm">
                    {displayExpiry}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white text-lg font-bold italic opacity-90">
                    {brand}
                  </p>
                </div>
              </div>
            </div>

            {/* Back */}
            <div
              className="card-face card-back rounded-2xl shadow-xl overflow-hidden"
              style={{ background: brandGradient(brand) }}
            >
              <div className="bg-black/60 h-10 mt-8" />
              <div className="px-5 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-8 bg-white/20 rounded" />
                  <div className="bg-white rounded px-3 py-1 min-w-12 text-center">
                    <p className="font-mono-data text-gray-800 text-sm font-bold">
                      {cvv || "•••"}
                    </p>
                  </div>
                </div>
                <p className="text-white/50 text-xs mt-2 text-right">CVV</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card form */}
        <form onSubmit={handlePay} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Card Number
            </label>
            <div className="relative">
              <input
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(formatCardNumber(e.target.value))
                }
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono-data focus:outline-none focus:border-teal-500 transition-all"
                inputMode="numeric"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {brand !== "Card" && (
                  <span className="text-xs font-bold text-gray-500">
                    {brand}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Cardholder Name
            </label>
            <input
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              placeholder="FULL NAME"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono-data focus:outline-none focus:border-teal-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Expiry
              </label>
              <input
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                inputMode="numeric"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono-data focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                CVV
              </label>
              <input
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                onFocus={() => setFlipped(true)}
                onBlur={() => setFlipped(false)}
                placeholder="•••"
                inputMode="numeric"
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono-data focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Consultation</span>
              <span>{formatINR(doctor?.fee ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Platform fee</span>
              <span>{formatINR(49)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
              <span>Total</span>
              <span style={{ color: "var(--primary)" }}>
                {formatINR(total)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-xs text-gray-400">
              256-bit SSL encryption. Your card details are never stored.
            </p>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-teal-100 disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: processing ? "#6B7280" : "var(--primary)" }}
          >
            {processing ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing payment…
              </>
            ) : (
              `Pay ${formatINR(total)}`
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Test card: <span className="font-mono">4242 4242 4242 4242</span> ·
            Any future expiry/CVV
          </p>
        </form>
      </div>
    </div>
  )
}
