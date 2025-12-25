import axios from 'axios'

/**
 * Configured axios instance for API calls.
 * Uses cookies for authentication instead of Bearer tokens.
 */
const api = axios.create({
  // Proxy handles the URL now - requests go to same origin /api/...
  baseURL: '',
  withCredentials: true  // CRITICAL: Sends JSESSIONID cookie with every request
})

export default api
