import { useEffect, useState } from "react";
import { tenantAPI } from "../../api";

export default function TenantHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await tenantAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const unpaidPayments = data.payments.filter(p => !p.paid);
  const recentNotices = data.notices.slice(0, 3);
  const upcomingEvents = data.events.slice(0, 3);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Your Dashboard</h1>

      {/* House Info Card */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">My House</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-sm">House Number</p>
            <p className="text-2xl font-bold text-green-600">{data.house.number}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Status</p>
            <span className="badge badge-success">{data.house.status}</span>
          </div>
        </div>
        {data.house.residents && data.house.residents.length > 0 && (
          <div className="mt-4">
            <p className="text-gray-600 text-sm">Residents</p>
            <p className="text-gray-900">{data.house.residents.join(", ")}</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-gray-600 text-sm">Unpaid Payments</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{unpaidPayments.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Total Notices</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{data.notices.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Upcoming Events</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{data.events.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Maintenance Requests</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{data.maintenance_requests.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payments Due */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Payments Due</h2>
          {unpaidPayments.length === 0 ? (
            <p className="text-gray-600">No pending payments</p>
          ) : (
            <div className="space-y-3">
              {unpaidPayments.map((payment) => (
                <div key={payment.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <p className="font-semibold">KES {payment.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{payment.description}</p>
                  <p className="text-xs text-gray-500">Due: {payment.due_date}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Notices</h2>
          {recentNotices.length === 0 ? (
            <p className="text-gray-600">No notices</p>
          ) : (
            <div className="space-y-3">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-semibold">{notice.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{notice.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warnings */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="card lg:col-span-2 bg-red-50 border-2 border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-700">⚠️ Warnings</h2>
            <div className="space-y-3">
              {data.warnings.map((warning) => (
                <div key={warning.id} className="bg-white rounded-lg p-4">
                  <span className={`badge ${
                    warning.severity === 'high' ? 'badge-danger' :
                    warning.severity === 'medium' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {warning.severity}
                  </span>
                  <p className="mt-2 text-gray-700">{warning.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(warning.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
