const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'

function getToken() {
  return localStorage.getItem('sankalp_token') || sessionStorage.getItem('sankalp_token')
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong. Please try again.')
    err.errors = data.errors
    err.status = res.status
    throw err
  }
  return data
}
