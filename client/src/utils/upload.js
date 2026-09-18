// Real file uploads (multipart/form-data) — kept separate from apiFetch in
// api.js, which always sends Content-Type: application/json and would break
// a multipart body. Demo mode has nowhere to actually store a file, so it
// returns a client-only object URL instead (works for previewing in the
// current tab, but isn't persisted — consistent with demo mode's existing
// "no real backend" limitation elsewhere in this app).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// Photo/receipt URLs come back from the API as relative paths (`/api/files/
// <id>`) so they carry the session cookie when the browser requests them
// directly; demo mode's blob: URLs are already absolute and pass through
// unchanged.
export function resolveFileUrl(url) {
  if (!url) return url
  return url.startsWith('/api/') ? `${API_URL}${url}` : url
}

async function parseErrorResponse(res) {
  const data = await res.json().catch(() => ({}))
  const err = new Error(data.message || 'Upload failed')
  err.status = res.status
  return err
}

// Uploads are project-scoped (POST /api/projects/:id/files/...) so the
// server can check project membership before a file ever gets a
// project_files row — see server/src/controllers/filesController.js. The
// returned url is later read back through GET /api/files/:fileId, which
// re-checks that same membership on every read, not served from a public
// static path.
export async function uploadImages(projectId, files) {
  const fileList = Array.from(files || [])
  if (fileList.length === 0) return []
  if (DEMO_MODE) return fileList.map((f) => URL.createObjectURL(f))

  const form = new FormData()
  for (const file of fileList) form.append('files', file)
  const res = await fetch(`${API_URL}/api/projects/${projectId}/files/images`, { method: 'POST', credentials: 'include', body: form })
  if (!res.ok) throw await parseErrorResponse(res)
  const data = await res.json()
  return data.files.map((f) => f.url)
}

export async function uploadDocument(projectId, file) {
  if (!file) return null
  if (DEMO_MODE) return URL.createObjectURL(file)

  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/api/projects/${projectId}/files/document`, { method: 'POST', credentials: 'include', body: form })
  if (!res.ok) throw await parseErrorResponse(res)
  const data = await res.json()
  return data.url
}
