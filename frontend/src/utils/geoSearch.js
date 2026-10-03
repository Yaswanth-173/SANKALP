// Forward-geocodes a free-text place name (city, pincode, address) to
// coordinates via the same public Nominatim service already used elsewhere
// in this app for reverse geocoding (see ProgressUpdatesPage/MaterialsPage).
// It's rate-limited and best-effort — callers must handle a null result.
export async function forwardGeocode(text) {
  if (!text || !text.trim()) return null
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(text.trim())}`
    )
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) return null
    return { lat: Number(data[0].lat), lng: Number(data[0].lon), label: data[0].display_name }
  } catch {
    return null
  }
}

export function timeAgo(iso) {
  if (!iso) return null
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0) return 'just now'
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
}

export function whatsappLink(phone, text) {
  const digits = (phone || '').replace(/[^\d]/g, '')
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function directionsLink(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
