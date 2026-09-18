// Real file uploads (multipart/form-data) — kept separate from apiFetch in
// api.js, which always sends Content-Type: application/json and would break
// a multipart body. Demo mode has nowhere to actually store a file, so it
// returns a client-only object URL instead (works for previewing in the
// current tab, but isn't persisted — consistent with demo mode's existing
// "no real backend" limitation elsewhere in this app).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

async function parseErrorResponse(res) {
  const data = await res.json().catch(() => ({}))
  const err = new Error(data.message || 'Upload failed')
  err.status = res.status
  return err
}

export async function uploadImages(files) {
  const fileList = Array.from(files || [])
  if (fileList.length === 0) return []
  if (DEMO_MODE) return fileList.map((f) => URL.createObjectURL(f))

  const form = new FormData()
  for (const file of fileList) form.append('files', file)
  const res = await fetch(`${API_URL}/api/uploads/images`, { method: 'POST', credentials: 'include', body: form })
  if (!res.ok) throw await parseErrorResponse(res)
  const data = await res.json()
  return data.urls
}

export async function uploadDocument(file) {
  if (!file) return null
  if (DEMO_MODE) return URL.createObjectURL(file)

  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/api/uploads/document`, { method: 'POST', credentials: 'include', body: form })
  if (!res.ok) throw await parseErrorResponse(res)
  const data = await res.json()
  return data.url
}
