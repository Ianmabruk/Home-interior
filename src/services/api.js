import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hok_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshingPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error.config

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('hok_refresh_token')
    if (!refreshToken) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (!refreshingPromise) {
      refreshingPromise = api
        .post('/auth/refresh', { refreshToken })
        .then((res) => {
          localStorage.setItem('hok_access_token', res.data.accessToken)
          localStorage.setItem('hok_refresh_token', res.data.refreshToken)
          return res.data.accessToken
        })
        .finally(() => {
          refreshingPromise = null
        })
    }

    const newToken = await refreshingPromise
    originalRequest.headers.Authorization = `Bearer ${newToken}`

    return api(originalRequest)
  },
)
