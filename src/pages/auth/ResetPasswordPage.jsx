import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../services/api'

export const ResetPasswordPage = () => {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    await api.post(`/auth/reset-password/${token}`, { password })
    setMessage('Password reset successful. You can now login.')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="font-display text-4xl">Reset Password</h1>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      <input className="w-full rounded-lg border border-black/15 px-3 py-2" placeholder="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="w-full rounded-full bg-orange px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink">Update password</button>
    </form>
  )
}
