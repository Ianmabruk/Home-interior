import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const AccountPage = () => {
  const { user, refreshUser, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        console.info('[account] loading orders for user:', user?._id || user?.id)
        const res = await api.get('/orders/me')
        setOrders(res.data || [])
        console.info('[account] orders loaded:', res.data?.length || 0)
      } catch (err) {
        console.warn('[account] failed to load orders:', err?.response?.status, err?.message)
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }
    if (user) loadOrders()
  }, [user])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-700 bg-green-50'
      case 'shipped':
        return 'text-blue-700 bg-blue-50'
      case 'processing':
        return 'text-orange-700 bg-orange-50'
      case 'cancelled':
        return 'text-red-700 bg-red-50'
      default:
        return 'text-ink/60 bg-sand'
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-48 rounded bg-sand" />
          <div className="h-64 rounded-2xl bg-sand" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl">My Account</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-3xl">Profile</h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm"><span className="font-medium">Name:</span> {user?.fullName || 'N/A'}</p>
            <p className="text-sm"><span className="font-medium">Email:</span> {user?.email || 'N/A'}</p>
            <p className="text-sm"><span className="font-medium">Role:</span> {user?.role || 'N/A'}</p>
            <p className="text-sm"><span className="font-medium">Member since:</span> {formatDate(user?.createdAt)}</p>
            <p className="text-sm"><span className="font-medium">Last login:</span> {formatDate(user?.lastLoginAt)}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="font-display text-3xl">Order History</h2>
          <div className="mt-4 space-y-3">
            {ordersLoading && <p className="text-sm text-ink/65">Loading orders...</p>}
            {!ordersLoading && orders.length === 0 && (
              <p className="text-sm text-ink/65">No orders yet.</p>
            )}
            {orders.map((order) => (
              <article
                key={order._id}
                className="rounded-2xl border border-black/10 p-4 text-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    Order #{order._id?.slice ? order._id.slice(-6).toUpperCase() : order._id}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-2xs font-medium uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {order.status || 'pending'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/60">Placed on {formatDate(order.createdAt)}</p>
                <p className="mt-1 font-medium">Total: ${Number(order.total || 0).toFixed(2)}</p>
                {order.items?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-ink/60">
                        {item.name || 'Product'} x{item.quantity}
                        {item.variant?.colorName && <span> - {item.variant.colorName}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
