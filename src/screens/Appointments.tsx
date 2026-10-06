import { useState } from "react"
import { useApp } from "../context"
import { useNav } from "../nav"
import { api } from "../api"
import { formatINR, formatIndiaDate } from "../format"

function statusColor(s: string) {
  if (s === "upcoming")
    return { dot: "#0A6375", bg: "#EBF5F7", text: "#0A6375" }
  if (s === "completed")
    return { dot: "#059669", bg: "#ECFDF5", text: "#059669" }
  return { dot: "#DC2626", bg: "#FEF2F2", text: "#DC2626" }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return {
    day: formatIndiaDate(d, { weekday: "short" }),
    date: d.getDate(),
    month: formatIndiaDate(d, { month: "short" }),
    full: formatIndiaDate(d, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  }
}

export function AppointmentsScreen() {
  const { appointments, refreshAppointments } = useApp()
  const { push, setTab } = useNav()
  const [filter, setFilter] =
    useState<"all" | "upcoming" | "completed" | "cancelled">("all")
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  const filtered = appointments.filter(
    (a) => filter === "all" || a.status === filter,
  )
  const upcoming = appointments.filter((a) => a.status === "upcoming").length

  async function handleCancel() {
    if (!cancelId) return
    setCancelling(true)
    try {
      await api.appointments.cancel(cancelId)
      await refreshAppointments()
      setCancelId(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCancelling(false)
    }
  }

  const detailAppt = selected
    ? appointments.find((a) => a.id === selected)
    : null

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          Appointments
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {upcoming} upcoming · {appointments.length} total
        </p>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-2 px-5 py-3 bg-white overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {(["all", "upcoming", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              filter === f ? "text-white" : "bg-gray-100 text-gray-500"
            }`}
            style={filter === f ? { background: "var(--primary)" } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4 space-y-3">
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm font-semibold text-gray-700">
              No {filter === "all" ? "" : filter} appointments
            </p>
            {filter === "upcoming" && (
              <button
                onClick={() => setTab("book")}
                className="mt-3 px-4 py-2 rounded-lg text-xs font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                Book Now
              </button>
            )}
          </div>
        )}

        {filtered.map((appt) => {
          const { dot, bg, text } = statusColor(appt.status)
          const d = formatDate(appt.date)
          return (
            <div
              key={appt.id}
              onClick={() => setSelected(appt.id)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm cursor-pointer active:scale-98 transition-all"
            >
              <div className="flex items-stretch">
                {/* Color accent */}
                <div className="w-1 shrink-0" style={{ background: dot }} />

                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    {/* Date block */}
                    <div className="text-center shrink-0 w-11 bg-gray-50 rounded-xl py-2">
                      <p className="text-xs text-gray-400 font-mono-data">
                        {d.day}
                      </p>
                      <p className="font-display text-xl font-bold text-gray-900 leading-none">
                        {d.date}
                      </p>
                      <p className="text-xs text-gray-400">{d.month}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {appt.doctor}
                          </p>
                          <p className="text-xs text-gray-400">
                            {appt.specialty}
                          </p>
                        </div>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: bg, color: text }}
                        >
                          {appt.status.charAt(0).toUpperCase() +
                            appt.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs text-gray-500 font-mono-data">
                            {appt.time}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                            appt.type === "Virtual"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {appt.type === "Virtual" ? "🎥" : "🏥"} {appt.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for upcoming */}
                  {appt.status === "upcoming" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      {appt.type === "Virtual" && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                          style={{ background: "var(--accent)" }}
                        >
                          🎥 Join Call
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCancelId(appt.id)
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      {detailAppt && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full bg-white rounded-t-3xl p-5 pb-8 max-h-[80%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl overflow-hidden">
                <img
                  src={detailAppt.photo}
                  alt={detailAppt.doctor}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {detailAppt.doctor}
                </p>
                <p className="text-sm text-gray-500">{detailAppt.specialty}</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Date", val: formatDate(detailAppt.date).full },
                { label: "Time", val: detailAppt.time },
                { label: "Type", val: detailAppt.type },
                { label: "Location", val: detailAppt.location },
                { label: "Status", val: detailAppt.status },
                { label: "Fee", val: formatINR(detailAppt.fee) },
                { label: "Payment", val: detailAppt.paymentStatus },
                { label: "Payment ID", val: detailAppt.paymentId },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between py-2 border-b border-gray-50"
                >
                  <span className="text-sm text-gray-500">{r.label}</span>
                  <span className="text-sm font-medium text-gray-900 font-mono-data">
                    {r.val}
                  </span>
                </div>
              ))}
              {detailAppt.notes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{detailAppt.notes}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cancel confirm modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCancelId(null)}
          />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-red-500"
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
            </div>
            <h3 className="font-display text-lg font-semibold text-center mb-1">
              Cancel Appointment?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Your payment will be fully refunded within 3-5 business days.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700"
              >
                Keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
