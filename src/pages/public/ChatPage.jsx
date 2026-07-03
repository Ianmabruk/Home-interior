import { useMemo, useState } from 'react'

const initialMessages = [
  { id: 'm1', role: 'agent', text: 'Welcome to HOK support. How can we help you today?', time: '09:00' },
]

export const ChatPage = () => {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')

  const chatProviders = useMemo(
    () => [
      { label: 'WhatsApp Integration', status: 'Planned' },
      { label: 'Live Agent Routing', status: 'Planned' },
      { label: 'Ticketing Sync', status: 'Planned' },
    ],
    [],
  )

  const sendMessage = (event) => {
    event.preventDefault()
    if (!input.trim()) {
      return
    }

    const next = {
      id: String(Date.now()),
      role: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, next])
    setInput('')
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-[1fr_320px] md:px-8">
      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
        <h1 className="font-display text-5xl">Customer Support Chat</h1>
        <div className="mt-6 h-[460px] space-y-3 overflow-y-auto rounded-xl bg-cream p-4">
          {messages.map((message) => (
            <div key={message.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-ink text-white' : 'bg-white text-ink'}`}>
              <p>{message.text}</p>
              <p className={`mt-1 text-[10px] ${message.role === 'user' ? 'text-white/70' : 'text-ink/40'}`}>{message.time}</p>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full rounded-xl border border-black/15 px-3 py-2" placeholder="Write your message..." />
          <button className="rounded-xl bg-orange px-4 py-2 text-xs uppercase tracking-[0.14em]">Send</button>
        </form>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-display text-3xl">Integrations</h2>
        <div className="mt-4 space-y-2">
          {chatProviders.map((item) => (
            <div key={item.label} className="rounded-xl border border-black/10 p-3">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-orange">{item.status}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
