import { useEffect, useState } from "react";
import { adminAPI } from "../../api";

export default function AdminMaintenance() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const response = await adminAPI.getMaintenanceRequests();
    setRequests(response.data);
  };

  const updateStatus = async (id, status) => {
    await adminAPI.updateMaintenanceRequest(id, { status });
    loadRequests();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Maintenance Requests</h1>
      
      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{req.title}</h3>
                <p className="text-gray-700 mt-2">{req.description}</p>
                <p className="text-sm text-gray-500 mt-2">House {req.house_id} • {new Date(req.created_at).toLocaleDateString()}</p>
              </div>
              <select 
                className="border p-2 rounded" 
                value={req.status} 
                onChange={e => updateStatus(req.id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
