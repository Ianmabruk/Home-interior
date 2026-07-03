import { useState } from 'react'
import { api } from '../../services/api'

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    await api.post('/auth/forgot-password', { email })
    setMessage('If your account exists, a reset link has been sent.')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="font-display text-4xl">Forgot Password</h1>
      <p className="text-sm text-ink/70">Enter your email to receive a reset link.</p>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      <input className="w-full rounded-lg border border-black/15 px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="w-full rounded-full bg-ink px-4 py-3 text-xs uppercase tracking-[0.16em] text-white">Send reset link</button>
    </form>
  )
}
