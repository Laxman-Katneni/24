import axios from 'axios'

/**
 * Configured axios instance for API calls.
 * Uses cookies for authentication instead of Bearer tokens.
 * 
 * IMPORTANT: baseURL is empty so requests go through the frontend proxy (server.js)
 * The proxy forwards /api, /auth, and /oauth2 requests to the backend API.
 * This ensures all requests appear to come from the same origin, allowing cookie sharing.
 */
const api = axios.create({
  baseURL: '',  // Empty = use same origin, proxy handles routing to backend
  withCredentials: true  // CRITICAL: Sends JSESSIONID cookie with every request
})

export default api
