import { useState, useEffect } from "react"
import { useNav } from "../nav"
import { api, type Doctor } from "../api"
import { formatINR } from "../format"

const SPECIALTIES = [
  "All",
  "Cardiology",
  "Neurology",
  "General Practice",
  "Orthopedics",
  "Dermatology",
  "Psychiatry",
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${
            i <= Math.floor(rating) ? "text-amber-400" : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function DoctorsScreen() {
  const { push, setTab } = useNav()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [specialty, setSpecialty] = useState("All")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Doctor | null>(null)

  useEffect(() => {
    setLoading(true)
    api.doctors
      .list({
        specialty: specialty !== "All" ? specialty : undefined,
        q: query || undefined,
      })
      .then(setDoctors)
      .finally(() => setLoading(false))
  }, [specialty, query])

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-5 pb-3 space-y-3">
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          Find Doctors
        </h1>

        {/* Search */}
        <div className="relative">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialty, hospital…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-teal-500 transition-all"
          />
        </div>

        {/* Specialty filter */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                specialty === s ? "text-white" : "bg-gray-100 text-gray-500"
              }`}
              style={specialty === s ? { background: "var(--primary)" } : {}}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4 space-y-3">
        {loading && (
          <div className="py-10 text-center text-gray-400 text-sm">
            Loading doctors…
          </div>
        )}

        {!loading && doctors.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-semibold text-gray-700">
              No doctors found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try a different search term or specialty
            </p>
          </div>
        )}

        {doctors.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelected(doc)}
            className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left shadow-sm active:scale-98 transition-all"
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                <img
                  src={doc.photo}
                  alt={doc.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-400">{doc.specialty}</p>
                  </div>
                  <p
                    className="font-display text-lg font-bold shrink-0"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatINR(doc.fee)}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{doc.hospital}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StarRating rating={doc.rating} />
                  <span className="text-xs text-gray-400 font-mono-data">
                    {doc.rating} ({doc.reviews})
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    {doc.experience}y exp.
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Next:</span>
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  {doc.nextAvailable}
                </span>
              </div>
              <div className="flex gap-1">
                {(doc.consultType === "both" ||
                  doc.consultType === "virtual") && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                    🎥 Virtual
                  </span>
                )}
                {(doc.consultType === "both" ||
                  doc.consultType === "in-person") && (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                    🏥 In-Person
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Doctor profile sheet */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full bg-white rounded-t-3xl max-h-[90%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero image */}
            <div className="h-40 relative overflow-hidden rounded-t-3xl">
              <img
                src={selected.photo}
                alt={selected.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-14">
                <h2 className="font-display text-xl font-semibold text-white">
                  {selected.name}
                </h2>
                <p className="text-white/80 text-sm">
                  {selected.specialty} · {selected.experience} yrs exp.
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Rating + fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarRating rating={selected.rating} />
                  <span className="text-sm font-semibold">
                    {selected.rating}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({selected.reviews} reviews)
                  </span>
                </div>
                <div className="text-right">
                  <p
                    className="font-display text-2xl font-bold"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatINR(selected.fee)}
                  </p>
                  <p className="text-xs text-gray-400">per consultation</p>
                </div>
              </div>

              {/* Consult types */}
              <div className="flex gap-2">
                {(selected.consultType === "both" ||
                  selected.consultType === "virtual") && (
                  <span className="flex-1 py-2 text-center text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-xl">
                    🎥 Virtual Consultation
                  </span>
                )}
                {(selected.consultType === "both" ||
                  selected.consultType === "in-person") && (
                  <span className="flex-1 py-2 text-center text-xs font-semibold bg-blue-50 text-blue-700 rounded-xl">
                    🏥 In-Person Visit
                  </span>
                )}
              </div>

              {/* Bio */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  About
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selected.bio}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">🏥</span>
                  <div>
                    <p className="text-xs text-gray-400">Hospital</p>
                    <p className="text-sm font-medium">{selected.hospital}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">🎓</span>
                  <div>
                    <p className="text-xs text-gray-400">Education</p>
                    <p className="text-sm font-medium">{selected.education}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">🌐</span>
                  <div>
                    <p className="text-xs text-gray-400">Languages</p>
                    <p className="text-sm font-medium">
                      {selected.languages.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">📅</span>
                  <div>
                    <p className="text-xs text-gray-400">Available days</p>
                    <p className="text-sm font-medium">
                      {selected.available.join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 pb-2 space-y-2">
                <div className="bg-emerald-50 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-sm">✅</span>
                  <p className="text-xs font-medium text-emerald-700">
                    Next available: {selected.nextAvailable}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelected(null)
                    setTab("book")
                  }}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white shadow-lg"
                  style={{ background: "var(--primary)" }}
                >
                  Book Appointment · {formatINR(selected.fee + 49)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
