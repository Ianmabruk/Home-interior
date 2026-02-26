import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../api";

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => loadStats(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  if (loading || !stats) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const occupancyRate =
    stats.total_houses > 0
      ? Math.round((stats.occupied_houses / stats.total_houses) * 100)
      : 0;

  const cards = [
    {
      label: "Total Houses",
      value: stats.total_houses,
      tone: "from-emerald-500 to-green-600",
      href: "/admin/houses",
    },
    {
      label: "Occupied Houses",
      value: stats.occupied_houses,
      tone: "from-blue-500 to-indigo-600",
      href: "/admin/houses",
    },
    {
      label: "Vacant Houses",
      value: stats.vacant_houses,
      tone: "from-violet-500 to-purple-600",
      href: "/admin/houses",
    },
    {
      label: "Total Tenants",
      value: stats.total_tenants,
      tone: "from-orange-500 to-amber-600",
      href: "/admin/tenants",
    },
    {
      label: "Pending Payments",
      value: stats.pending_payments,
      tone: "from-rose-500 to-red-600",
      href: "/admin/payments",
    },
    {
      label: "Pending Maintenance",
      value: stats.pending_maintenance,
      tone: "from-yellow-500 to-orange-600",
      href: "/admin/maintenance",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : "Loading latest data..."}
          </p>
        </div>
        <button
          onClick={() => loadStats(true)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Stats"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.label} to={card.href} className={`card bg-gradient-to-br ${card.tone} text-white hover:scale-[1.01] transition-transform`}>
            <p className="text-sm opacity-90">{card.label}</p>
            <p className="text-4xl font-bold mt-2">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Occupancy Health</h2>
            <span className="text-sm text-gray-600">{occupancyRate}% Occupied</span>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-green-600 transition-all" style={{ width: `${occupancyRate}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total_houses}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-gray-500">Occupied</p>
              <p className="text-xl font-semibold text-green-700">{stats.occupied_houses}</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-xs text-gray-500">Vacant</p>
              <p className="text-xl font-semibold text-yellow-700">{stats.vacant_houses}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold">Attention Needed</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="font-medium text-red-700">Pending payments: {stats.pending_payments}</p>
              <Link to="/admin/payments" className="text-red-600 hover:text-red-700 underline">
                Review payments
              </Link>
            </div>
            <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
              <p className="font-medium text-yellow-700">Maintenance tickets: {stats.pending_maintenance}</p>
              <Link to="/admin/maintenance" className="text-yellow-700 hover:text-yellow-800 underline">
                Manage requests
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/houses" className="card hover:shadow-xl transition-shadow cursor-pointer">
            <p className="text-green-600 font-semibold">➕ Add New House</p>
          </Link>
          <Link to="/admin/tenants" className="card hover:shadow-xl transition-shadow cursor-pointer">
            <p className="text-blue-600 font-semibold">👤 Manage Tenants</p>
          </Link>
          <Link to="/admin/notices" className="card hover:shadow-xl transition-shadow cursor-pointer">
            <p className="text-purple-600 font-semibold">📢 Send Notice</p>
          </Link>
          <Link to="/admin/payments" className="card hover:shadow-xl transition-shadow cursor-pointer">
            <p className="text-orange-600 font-semibold">💰 Add Payment</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
