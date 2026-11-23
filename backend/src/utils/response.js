import { ApiError } from './ApiError.js'

export const success = (data = null) => ({ success: true, data })

export const failure = (status, message, code = null) => {
  const error = new ApiError(status, message)
  if (code) error.code = code
  throw error
}
