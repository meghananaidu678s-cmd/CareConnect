import { AppProvider, useApp } from "./context"
import { NavProvider, useNav, MAIN_TABS, type ScreenName } from "./nav"
import { LoginScreen } from "./screens/Login"
import { HomeScreen } from "./screens/Home"
import { AppointmentsScreen } from "./screens/Appointments"
import { BookingScreen } from "./screens/Booking"
import { PaymentScreen } from "./screens/Payment"
import { DoctorsScreen } from "./screens/Doctors"
import { ProfileScreen } from "./screens/Profile"
import { MessagesScreen } from "./screens/Messages"
import { NotificationsScreen } from "./screens/Notifications"

// ─── Tab navigation icons ───────────────────────────────────────────────────

const TAB_CONFIG: Array<{ id: ScreenName; label: string; icon: string }> = [
  {
    id: "home",
    label: "Home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "appointments",
    label: "Schedule",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  { id: "book", label: "", icon: "M12 4v16m8-8H4" },
  {
    id: "doctors",
    label: "Doctors",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "profile",
    label: "Profile",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
]

// ─── Status bar ────────────────────────────────────────────────────────────

function StatusBar({ light = false }: { light?: boolean }) {
  const color = light ? "text-white" : "text-gray-800"
  return (
    <div
      className={`flex items-center justify-between px-5 pt-3 pb-1 shrink-0 ${color}`}
    >
      <span className="font-mono-data text-xs font-semibold">9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Signal */}
        <div className="flex items-end gap-px h-3">
          {[30, 55, 75, 100].map((h, i) => (
            <div
              key={i}
              className="w-0.5 rounded-sm"
              style={{
                height: `${h}%`,
                background: "currentColor",
                opacity: i < 3 ? 1 : 1,
              }}
            />
          ))}
        </div>
        {/* WiFi */}
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M1.5 8.5a13 13 0 0121 0M5.25 12.25a8.5 8.5 0 0113.5 0M9 16a5 5 0 016 0M12 20h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {/* Battery */}
        <div className="flex items-center">
          <div className="w-5 h-2.5 rounded border border-current flex items-center px-0.5">
            <div
              className="h-1.5 rounded-sm w-[75%]"
              style={{ background: "currentColor" }}
            />
          </div>
          <div
            className="w-px h-1.5 rounded-r"
            style={{ background: "currentColor" }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Screen renderer ────────────────────────────────────────────────────────

function ScreenRenderer() {
  const { screen } = useNav()

  switch (screen.name) {
    case "home":
      return <HomeScreen />
    case "appointments":
      return <AppointmentsScreen />
    case "book":
      return <BookingScreen />
    case "doctors":
      return <DoctorsScreen />
    case "profile":
      return (
        <ProfileScreen
          initialSubscreen={
            (screen.params as { subscreen?: "records" })?.subscreen
          }
        />
      )
    case "payment":
      return <PaymentScreen params={screen.params as any} />
    case "messages":
      return <MessagesScreen params={screen.params as any} />
    case "notifications":
      return <NotificationsScreen />
    default:
      return <HomeScreen />
  }
}

// ─── Main app shell ─────────────────────────────────────────────────────────

function AppShell() {
  const { screen, tab, setTab, canGoBack } = useNav()
  const { unreadCount } = useApp()

  const isHeaderDark = screen.name === "home" || screen.name === "profile"
  const isOverlay = ["payment", "messages", "notifications"].includes(
    screen.name,
  )
  const isMainTab = MAIN_TABS.includes(screen.name)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Status bar */}
      <StatusBar light={isHeaderDark} />

      {/* Screen content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ScreenRenderer />
      </div>

      {/* Bottom navigation */}
      {!isOverlay && (
        <nav
          className="shrink-0 bg-white border-t border-gray-100 flex items-center px-2 safe-area-bottom"
          style={{ height: 64 }}
        >
          {TAB_CONFIG.map((item) => {
            if (item.id === "book") {
              return (
                <div
                  key="book"
                  className="flex-1 flex items-center justify-center"
                >
                  <button
                    onClick={() => setTab("book")}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95"
                    style={{
                      background:
                        tab === "book" ? "var(--accent)" : "var(--primary)",
                      boxShadow: "0 4px 20px rgba(10,99,117,0.35)",
                      transform: "translateY(-10px)",
                    }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={item.icon}
                      />
                    </svg>
                  </button>
                </div>
              )
            }

            const active = tab === item.id && isMainTab
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-all"
                style={{ color: active ? "var(--primary)" : "#9CA3AF" }}
              >
                <div className="relative">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={active ? 2.2 : 1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={item.icon}
                    />
                  </svg>
                  {item.id === "home" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none bg-red-400 text-[9px]">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "var(--primary)" }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

// ─── Auth gate ──────────────────────────────────────────────────────────────

function AuthGate() {
  const { user, loading } = useApp()

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{
          background: "linear-gradient(160deg, #0A6375 0%, #12A882 100%)",
        }}
      >
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <p className="font-display text-xl text-white font-semibold">
          CareConnect
        </p>
        <div className="flex gap-1 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/50 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col h-full overflow-y-auto bg-background">
        <StatusBar />
        <LoginScreen />
      </div>
    )
  }

  return <AppShell />
}

// ─── Root ───────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <div className="phone-shell">
        <NavProvider>
          <AuthGate />
        </NavProvider>
      </div>
    </AppProvider>
  )
}
