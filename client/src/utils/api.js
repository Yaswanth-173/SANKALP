const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
import { demoFetch } from './demoApi.js'

export async function apiFetch(path, options = {}) {
  if (DEMO_MODE) return demoFetch(path, options)
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
