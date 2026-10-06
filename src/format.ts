export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatIndiaDate(
  date: Date,
  options: Intl.DateTimeFormatOptions,
) {
  return date.toLocaleDateString("en-IN", options)
}
