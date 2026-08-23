import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { PageMeta } from '../../hooks/usePageMeta'

export function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState(!token ? 'idle' : 'loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    async function fetchUnsubscribe() {
      try {
        const res = await api.get(`/content/unsubscribe?token=${encodeURIComponent(token)}`)
        if (res.data?.success) {
          setStatus('done')
          setMessage(res.data?.data?.message || 'You have been unsubscribed from marketing emails.')
        } else {
          setStatus('error')
          setMessage('Unable to process unsubscribe request.')
        }
      } catch (err) {
        setStatus('error')
        setMessage(err?.response?.data?.message || 'Unable to process unsubscribe request.')
      }
    }
    fetchUnsubscribe()
  }, [token])

  return (
    <>
      <PageMeta title="Unsubscribe — HOK Interiors" description="Unsubscribe from HOK Interiors marketing emails." />
      <main className="min-h-[70vh] flex items-center justify-center bg-[var(--bg)]">
        <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-10 max-w-md text-center">
          <h1 className="font-display text-2xl text-[var(--primary)] mb-4">
            {status === 'error' ? 'Something went wrong' : 'Unsubscribed'}
          </h1>
          <p className="text-[var(--primary)]/60 mb-6">{message}</p>
          {status !== 'done' && (
            <p className="text-xs text-[var(--primary)]/40">
              If the problem continues, contact us at{' '}
              <a href="mailto:info@hokinteriors.co.ke" className="text-[var(--accent)]">info@hokinteriors.co.ke</a>.
            </p>
          )}
        </div>
      </main>
    </>
  )
}

export default UnsubscribePage
