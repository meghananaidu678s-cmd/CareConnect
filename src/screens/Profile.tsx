import { useState, useEffect } from "react"
import { useApp } from "../context"
import { useNav } from "../nav"
import { api, type HealthRecord, type Payment } from "../api"
import { formatINR, formatIndiaDate } from "../format"

export function ProfileScreen({
  initialSubscreen = "main",
}: {
  initialSubscreen?: "main" | "records" | "payments" | "notifications"
}) {
  const { user, appointments, logout } = useApp()
  const { push } = useNav()
  const [subscreen, setSubscreen] = useState(initialSubscreen)
  const [records, setRecords] = useState<HealthRecord | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [recordsTab, setRecordsTab] =
    useState<"vitals" | "medications" | "labs" | "history">("vitals")

  useEffect(() => {
    setSubscreen(initialSubscreen)
  }, [initialSubscreen])

  useEffect(() => {
    if (subscreen === "records" && !records) {
      api.records
        .get()
        .then(setRecords)
        .catch(() => {})
    }
    if (subscreen === "payments" && payments.length === 0) {
      api.payments
        .list()
        .then(setPayments)
        .catch(() => {})
    }
  }, [subscreen])

  const completed = appointments.filter((a) => a.status === "completed").length
  const upcoming = appointments.filter((a) => a.status === "upcoming").length

  if (subscreen === "records") {
    return (
      <div className="flex flex-col min-h-full">
        <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
          <button
            onClick={() => setSubscreen("main")}
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
            Profile
          </button>
          <h1 className="font-display text-2xl font-semibold">
            Health Records
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Patient: {user?.name} · ID: {user?.patientId}
          </p>

          <div
            className="flex gap-1 mt-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {([
              ["vitals", "Vitals"],
              ["medications", "Medications"],
              ["labs", "Lab Results"],
              ["history", "Visit History"],
            ] as const).map(([t, l]) => (
              <button
                key={t}
                onClick={() => setRecordsTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  recordsTab === t ? "text-white" : "bg-gray-100 text-gray-500"
                }`}
                style={recordsTab === t ? { background: "var(--primary)" } : {}}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-3">
          {!records && (
            <div className="py-10 text-center text-gray-400 text-sm">
              Loading…
            </div>
          )}

          {records && recordsTab === "vitals" && (
            <>
              <p className="text-xs text-gray-400">
                Last updated: {records.vitals.updatedAt || "N/A"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Blood Pressure",
                    val: records.vitals.bloodPressure,
                    unit: "mmHg",
                    icon: "🫀",
                  },
                  {
                    label: "Heart Rate",
                    val: records.vitals.heartRate,
                    unit: "bpm",
                    icon: "💓",
                  },
                  {
                    label: "Blood Glucose",
                    val: records.vitals.bloodGlucose,
                    unit: "mg/dL",
                    icon: "🩸",
                  },
                  {
                    label: "BMI",
                    val: records.vitals.bmi,
                    unit: "kg/m²",
                    icon: "⚖️",
                  },
                  {
                    label: "Cholesterol",
                    val: records.vitals.cholesterol,
                    unit: "mg/dL",
                    icon: "🧪",
                  },
                  {
                    label: "O₂ Saturation",
                    val: records.vitals.oxygenSat
                      ? `${records.vitals.oxygenSat}%`
                      : null,
                    unit: "SpO₂",
                    icon: "🫁",
                  },
                ]
                  .filter((v) => v.val)
                  .map((v) => (
                    <div
                      key={v.label}
                      className="bg-white rounded-2xl border border-gray-100 p-3"
                    >
                      <span className="text-2xl">{v.icon}</span>
                      <p className="font-display text-xl font-bold mt-1 text-gray-900">
                        {v.val}{" "}
                        <span className="text-xs font-sans font-normal text-gray-400">
                          {v.unit}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">{v.label}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                        Normal
                      </span>
                    </div>
                  ))}
              </div>
              {(records.conditions.length > 0 ||
                records.allergies.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {records.conditions.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-3">
                      <p className="text-xs font-semibold text-gray-400 mb-2">
                        Conditions
                      </p>
                      {records.conditions.map((c) => (
                        <p key={c} className="text-xs text-gray-700 py-0.5">
                          {c}
                        </p>
                      ))}
                    </div>
                  )}
                  {records.allergies.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-3">
                      <p className="text-xs font-semibold text-gray-400 mb-2">
                        Allergies
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {records.allergies.map((a) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {records && recordsTab === "medications" && (
            <div className="space-y-3">
              {records.medications.map((m) => (
                <div
                  key={m.name}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-blue-50">
                    💊
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {m.name}{" "}
                      <span className="font-mono-data font-normal text-xs text-gray-400">
                        {m.dose}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">{m.frequency}</p>
                    <p className="text-xs text-gray-400">
                      Prescribed by {m.doctor}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">Refill by</p>
                    <p className="font-mono-data text-xs font-medium text-gray-700">
                      {m.refillDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {records && recordsTab === "labs" && (
            <div className="space-y-2">
              {records.labs.map((l) => (
                <div
                  key={l.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{l.name}</p>
                      <p className="text-xs text-gray-400">
                        {l.doctor} · {l.date}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        l.status === "Normal"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2 py-1.5">
                    {l.result}
                  </p>
                </div>
              ))}
            </div>
          )}

          {recordsTab === "history" && (
            <div className="space-y-3">
              {appointments
                .filter((a) => a.status === "completed")
                .map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <p className="font-display text-sm font-bold text-gray-900 leading-none">
                        {new Date(a.date + "T00:00:00").getDate()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.date.split("-")[1]}/{a.date.split("-")[0].slice(2)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {a.doctor}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.specialty} · {a.type}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                      Done
                    </span>
                  </div>
                ))}
              {appointments.filter((a) => a.status === "completed").length ===
                0 && (
                <p className="text-center text-sm text-gray-400 py-8">
                  No visit history yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (subscreen === "payments") {
    return (
      <div className="flex flex-col min-h-full">
        <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
          <button
            onClick={() => setSubscreen("main")}
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
            Profile
          </button>
          <h1 className="font-display text-2xl font-semibold">
            Payment History
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-3">
          {payments.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">
              Loading…
            </div>
          )}
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-base">
                    💳
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {p.brand} ••••{p.last4}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatIndiaDate(new Date(p.createdAt), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <p
                  className="font-display text-lg font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {formatINR(p.amount)}
                </p>
              </div>
              <div className="flex justify-between text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                <span>
                  Consultation: {formatINR(p.consultationFee)} · Platform:{" "}
                  {formatINR(p.platformFee)}
                </span>
                <span className="font-mono-data">{p.id}</span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-600 font-medium">
                  Payment successful
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Main profile screen
  const MENU_ITEMS = [
    {
      label: "Health Records",
      sub: "Vitals, medications, lab results",
      icon: "📋",
      action: () => setSubscreen("records"),
    },
    {
      label: "Payment History",
      sub: "Billing and receipts",
      icon: "💳",
      action: () => setSubscreen("payments"),
    },
    {
      label: "Notifications",
      sub: "Reminders and alerts",
      icon: "🔔",
      action: () => push({ name: "notifications" }),
    },
    {
      label: "My Doctors",
      sub: "Your care team",
      icon: "👨‍⚕️",
      action: () => {},
    },
    {
      label: "Emergency Contacts",
      sub: user?.emergencyContact || "Add emergency contact",
      icon: "🚨",
      action: () => {},
    },
    {
      label: "Help & Support",
      sub: "FAQs and contact us",
      icon: "💬",
      action: () => {},
    },
    {
      label: "Privacy & Security",
      sub: "Password, permissions",
      icon: "🔒",
      action: () => {},
    },
  ]

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div
        className="px-5 pt-5 pb-6"
        style={{
          background: "linear-gradient(160deg, #0A6375 0%, #12A882 100%)",
        }}
      >
        <h1 className="font-display text-xl font-semibold text-white mb-4">
          Profile
        </h1>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/30 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&auto=format"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              {user?.name}
            </h2>
            <p className="text-white/70 text-sm">{user?.email}</p>
            <p className="text-white/60 text-xs mt-0.5 font-mono-data">
              {user?.patientId}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Appointments", val: appointments.length },
            { label: "Completed", val: completed },
            { label: "Upcoming", val: upcoming },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/10 rounded-xl py-2.5 text-center"
            >
              <p className="font-display text-xl font-bold text-white">
                {s.val}
              </p>
              <p className="text-white/60 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Patient info */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 bg-white border-b border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Blood Type", val: user?.bloodType || "—" },
              {
                label: "Date of Birth",
                val: user?.dob
                  ? formatIndiaDate(new Date(user.dob + "T00:00:00"), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              },
              { label: "Phone", val: user?.phone || "—" },
              { label: "Gender", val: user?.gender || "—" },
            ].map((r) => (
              <div key={r.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{r.label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {r.val}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu items */}
        <div className="px-5 py-4 space-y-2">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 text-left hover:bg-gray-50 transition-colors active:scale-98"
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 truncate">{item.sub}</p>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 shrink-0"
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
          ))}
        </div>

        {/* Logout */}
        <div className="px-5 pb-8">
          <button
            onClick={logout}
            className="w-full py-3.5 rounded-2xl text-sm font-bold border-2 border-red-200 text-red-500 bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
