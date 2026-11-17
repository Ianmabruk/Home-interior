export const success = (data = null) => ({ success: true, data })

export const failure = (status, message, code = null) => {
  const error = new Error(message)
  error.status = status
  if (code) error.code = code
  throw error
}
