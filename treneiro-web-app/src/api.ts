import axios from 'axios'

// In production (Docker), VITE_API_URL is empty so all requests go through
// the Nginx reverse proxy at /api/* → backend container.
// In development, set VITE_API_URL=http://localhost:8000 in .env.local
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
})

// ── Auth interceptor ───────────────────────────────────────────────────
// Automatically attach the Bearer token stored in localStorage to every
// outgoing request. This replaces all manual
// `axios.defaults.headers.common['Authorization'] = ...` calls.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
