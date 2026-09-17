// Generator ID: crypto.randomUUID bila tersedia; fallback time+random untuk
// browser lama / context tidak aman. Bentuk berprefix mempermudah tracing log.
export function newId(prefix = 'id') {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`
    }
  } catch {
    // randomUUID melempar di context tidak aman (mis. plain http) — fallback
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
