import { useEffect, useState } from "react";
import { tenantAPI } from "../../api";

export default function TenantMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await tenantAPI.getMaintenanceRequests();
      setRequests(response.data);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tenantAPI.createMaintenanceRequest(formData);
      setFormData({ title: "", description: "", priority: "normal" });
      setShowForm(false);
      loadRequests();
    } catch (error) {
      console.error("Failed to create request:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "badge-warning",
      in_progress: "badge-info",
      resolved: "badge-success",
    };
    return badges[status] || "badge-info";
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          {showForm ? "Cancel" : "New Request"}
        </button>
      </div>

      {/* Create Request Form */}
      {showForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Submit Maintenance Request</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Issue Title
              </label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Leaking faucet"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                className="input"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Priority
              </label>
              <select
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <button type="submit" className="btn">
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No maintenance requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{request.title}</h3>
                  <span className={`badge ${
                    request.priority === 'high' ? 'badge-danger' :
                    request.priority === 'normal' ? 'badge-warning' : 'badge-info'
                  } mt-2 inline-block`}>
                    {request.priority} priority
                  </span>
                </div>
                <span className={`badge ${getStatusBadge(request.status)}`}>
                  {request.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-gray-700 mb-3">{request.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                {request.resolved_at && (
                  <span>Resolved: {new Date(request.resolved_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
