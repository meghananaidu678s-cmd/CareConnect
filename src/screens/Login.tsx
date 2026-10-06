import { useState } from "react"
import { useApp } from "../context"
import { useNav } from "../nav"

function CareIcon() {
  return (
    <svg
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7-4.35-7-11a4 4 0 017-2.65A4 4 0 0119 10c0 6.65-7 11-7 11z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h2l1-2 1.25 4L14 12h1"
      />
    </svg>
  )
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
      />
    </div>
  )
}

export function LoginScreen() {
  const { login, register } = useApp()
  const { reset } = useNav()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Login fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Register fields
  const [rName, setRName] = useState("")
  const [rEmail, setREmail] = useState("")
  const [rPassword, setRPassword] = useState("")
  const [rConfirm, setRConfirm] = useState("")
  const [rPhone, setRPhone] = useState("")
  const [rDob, setRDob] = useState("")
  const [rGender, setRGender] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      reset({ name: "home" })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (step === 1) {
      if (!rName || !rEmail || !rPassword)
        return setError("All fields are required")
      if (rPassword.length < 8)
        return setError("Password must be at least 8 characters")
      if (rPassword !== rConfirm) return setError("Passwords do not match")
      return setStep(2)
    }
    setLoading(true)
    try {
      await register({
        name: rName,
        email: rEmail,
        password: rPassword,
        phone: rPhone,
        dob: rDob,
        gender: rGender,
      })
      reset({ name: "home" })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  function fillDemo() {
    setEmail("demo@careconnect.app")
    setPassword("demo1234")
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-9 text-white"
        style={{
          background:
            "linear-gradient(145deg, #073C49 0%, #0A6375 58%, #12A882 120%)",
        }}
      >
        <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full border border-white/10" />
        <div className="absolute -right-3 -top-5 h-28 w-28 rounded-full border border-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
              <CareIcon />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              CareConnect
            </span>
            <span className="ml-auto rounded-full border border-white/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75">
              Patient portal
            </span>
          </div>
          <p className="mt-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/80">
            <span
              className="flex h-3 w-4 flex-col overflow-hidden rounded-[2px]"
              aria-label="Indian flag"
            >
              <span className="h-1 flex-1 bg-[#FF9933]" />
              <span className="h-1 flex-1 bg-white" />
              <span className="h-1 flex-1 bg-[#138808]" />
            </span>
            Your care, connected across India
          </p>
          <h1 className="mt-1 max-w-[270px] font-display text-[32px] font-semibold leading-[1.08] tracking-tight text-white">
            Feel better,
            <br />
            starting here.
          </h1>
          <p className="mt-2 max-w-[270px] text-xs leading-relaxed text-white/70">
            A calmer way to manage appointments and stay close to your care
            team.
          </p>
        </div>

        {/* Tab switch */}
        <div className="relative mt-6 flex w-full rounded-xl border border-white/10 bg-black/10 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setStep(1)
                setError("")
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all capitalize ${
                mode === m
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="relative -mt-4 flex-1 overflow-y-auto rounded-t-[28px] bg-white px-6 pb-7 pt-6">
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                Secure patient access
              </div>
              <h2 className="font-display text-2xl font-semibold text-gray-900">
                Welcome back
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Sign in to pick up where you left off.
              </p>
            </div>

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

            <Field
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-16 text-sm transition-all focus:border-teal-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-teal-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition-all active:scale-98 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "linear-gradient(105deg, #0A6375, #0B806F)",
              }}
            >
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  Sign in securely <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                or try the demo
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button
              type="button"
              onClick={fillDemo}
              className="w-full rounded-xl border border-teal-100 bg-teal-50/70 py-3 text-sm font-semibold transition-all hover:bg-teal-50"
              style={{ color: "var(--primary)" }}
            >
              Fill demo sign-in
            </button>

            <p className="mt-2 text-center text-[11px] text-gray-400">
              Demo account:{" "}
              <span className="font-mono text-gray-500">
                demo@careconnect.app
              </span>{" "}
              / <span className="font-mono text-gray-500">demo1234</span>
            </p>
            <p className="pt-1 text-center text-[10px] leading-relaxed text-gray-400">
              By continuing, you agree to keep your account information private.
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
                >
                  <svg
                    className="w-4 h-4 text-gray-600"
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
              )}
              <div>
                <h2 className="font-display text-xl font-semibold text-gray-900">
                  {step === 1 ? "Create account" : "Personal details"}
                </h2>
                <p className="text-sm text-gray-500">Step {step} of 2</p>
              </div>
              <div className="ml-auto flex gap-1">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: s <= step ? 20 : 8,
                      background: s <= step ? "var(--primary)" : "#e5e7eb",
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {step === 1 ? (
              <>
                <Field
                  label="Full name"
                  value={rName}
                  onChange={setRName}
                  placeholder="Alex Rivera"
                  autoComplete="name"
                />
                <Field
                  label="Email address"
                  type="email"
                  value={rEmail}
                  onChange={setREmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <Field
                  label="Password"
                  type="password"
                  value={rPassword}
                  onChange={setRPassword}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <Field
                  label="Confirm password"
                  type="password"
                  value={rConfirm}
                  onChange={setRConfirm}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </>
            ) : (
              <>
                <Field
                  label="Phone number"
                  type="tel"
                  value={rPhone}
                  onChange={setRPhone}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
                <Field
                  label="Date of birth"
                  type="date"
                  value={rDob}
                  onChange={setRDob}
                  autoComplete="bday"
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Gender
                  </label>
                  <select
                    value={rGender}
                    onChange={(e) => setRGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  >
                    <option value="">Prefer not to say</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Other</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400">
                  This information helps us personalize your healthcare
                  experience. You can update it later.
                </p>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-98 disabled:opacity-60"
              style={{
                background: loading
                  ? "var(--muted-foreground)"
                  : "var(--primary)",
              }}
            >
              {loading
                ? "Creating account…"
                : step === 1
                  ? "Continue →"
                  : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
