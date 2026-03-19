import axios from 'axios'

// In production (Docker), VITE_API_URL is empty so all requests go through
// the Nginx reverse proxy at /api/* → backend container.
// In development, set VITE_API_URL=http://localhost:8000 in .env.local
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
})

export default instance
