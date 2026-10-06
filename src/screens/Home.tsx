import { useEffect, useState } from "react"
import { api, type Doctor } from "../api"
import { formatIndiaDate } from "../format"
import { useApp } from "../context"
import { useNav } from "../nav"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return formatIndiaDate(d, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

const QUICK_ACTIONS = [
  {
    label: "Book",
    sub: "Appointment",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    screen: "book",
    color: "#EBF5F7",
    iconColor: "#0A6375",
  },
  {
    label: "My",
    sub: "Records",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    screen: "records",
    color: "#F0FDF4",
    iconColor: "#059669",
  },
  {
    label: "Find",
    sub: "Doctors",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    screen: "doctors",
    color: "#FFF7ED",
    iconColor: "#EA580C",
  },
  {
    label: "Messages",
    sub: "& Chat",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    screen: "messages",
    color: "#FAF5FF",
    iconColor: "#7C3AED",
  },
]

export function HomeScreen() {
  const {
    user,
    appointments,
    notifications,
    unreadCount,
    refreshAppointments,
  } = useApp()
  const { push, setTab } = useNav()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorsError, setDoctorsError] = useState("")

  useEffect(() => {
    let active = true
    api.doctors
      .list()
      .then((items) => {
        if (active) setDoctors(items.slice(0, 4))
      })
      .catch((error) => {
        if (active)
          setDoctorsError(
            error instanceof Error ? error.message : "Unable to load doctors.",
          )
      })
    return () => {
      active = false
    }
  }, [])

  const upcoming = appointments.filter((a) => a.status === "upcoming")
  const nextAppt = upcoming[0]

  const completed = appointments.filter((a) => a.status === "completed").length
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className="px-5 pt-4 pb-6"
        style={{
          background: "linear-gradient(160deg, #0A6375 0%, #12A882 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/70 text-xs font-medium">{greeting()},</p>
            <h1 className="font-display text-xl font-semibold text-white">
              {user?.name?.split(" ")[0]} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => push({ name: "notifications" })}
              className="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-400 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
                  {unread}
                </span>
              )}
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/30">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Upcoming", val: upcoming.length, icon: "📅" },
            { label: "Completed", val: completed, icon: "✅" },
            { label: "Reminders", val: unreadCount, icon: "🔔" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/10 rounded-xl px-3 py-2.5 text-center"
            >
              <span className="text-base">{s.icon}</span>
              <p className="font-display text-xl font-bold text-white leading-none mt-0.5">
                {s.val}
              </p>
              <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 space-y-5 pb-4">
        {/* Next appointment */}
        {nextAppt ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2.5">
              Next Appointment
            </p>
            <div
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ background: "var(--card)" }}
            >
              <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-gray-100">
                  <img
                    src={nextAppt.photo}
                    alt={nextAppt.doctor}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {nextAppt.doctor}
                  </p>
                  <p className="text-xs text-gray-500">{nextAppt.specialty}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        nextAppt.type === "Virtual"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {nextAppt.type === "Virtual" ? "🎥" : "🏥"}{" "}
                      {nextAppt.type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs text-gray-500 font-mono-data">
                      {formatDate(nextAppt.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
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
                      {nextAppt.time}
                    </span>
                  </div>
                </div>
                {nextAppt.type === "Virtual" ? (
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    Join Call →
                  </button>
                ) : (
                  <button
                    onClick={() => setTab("appointments")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600"
                  >
                    Details
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 py-6 px-4 text-center">
            <p className="text-2xl mb-1">📅</p>
            <p className="text-sm font-semibold text-gray-700">
              No upcoming appointments
            </p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">
              Book your next visit with a doctor
            </p>
            <button
              onClick={() => setTab("book")}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              Book Now
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2.5">
            Quick Actions
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  if (a.screen === "records")
                    push({ name: "profile", params: { subscreen: "records" } })
                  else if (a.screen === "messages") push({ name: "messages" })
                  else setTab(a.screen as any)
                }}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all active:scale-95"
                style={{ background: a.color }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: a.iconColor + "20" }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: a.iconColor }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={a.icon}
                    />
                  </svg>
                </div>
                <p
                  className="text-xs font-semibold leading-none"
                  style={{ color: a.iconColor }}
                >
                  {a.label}
                </p>
                <p className="text-xs leading-none text-gray-400">{a.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Health tip */}
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)" }}
        >
          <span className="text-2xl shrink-0">💡</span>
          <div>
            <p className="text-xs font-bold text-amber-800">
              Health Tip of the Day
            </p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Stay hydrated — adults need 2–3 liters of water daily. Proper
              hydration improves energy, focus, and cardiovascular health.
            </p>
          </div>
        </div>

        {/* Care team horizontal scroll */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Your Care Team
            </p>
            <button
              onClick={() => setTab("doctors")}
              className="text-xs font-semibold"
              style={{ color: "var(--primary)" }}
            >
              See all
            </button>
          </div>
          {doctorsError ? (
            <p role="status" className="text-xs text-gray-500">
              {doctorsError}
            </p>
          ) : (
            <div
              className="flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {doctors.map((doc) => {
                return (
                  <button
                    key={doc.id}
                    onClick={() => setTab("doctors")}
                    className="flex flex-col items-center gap-1.5 shrink-0 transition-all active:scale-95"
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-gray-100">
                      <img
                        src={doc.photo}
                        alt={doc.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 text-center max-w-14 leading-tight">
                      {doc.name.split(" ").slice(0, 2).join(" ")}
                    </p>
                    <p className="text-xs text-gray-400 text-center max-w-14 leading-tight">
                      {doc.specialty}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
