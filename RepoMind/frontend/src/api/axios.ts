import axios from 'axios'

/**
 * Configured axios instance for API calls.
 * Uses cookies for authentication instead of Bearer tokens.
 */
const api = axios.create({
  // Use backend API URL from environment variable
  // In production: https://repomind-api.onrender.com
  // In development: http://localhost:8080
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true  // CRITICAL: Sends JSESSIONID cookie with every request
})

export default api
