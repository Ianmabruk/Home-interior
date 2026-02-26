import { useEffect, useState } from "react";
import { tenantAPI } from "../../api";

export default function TenantNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const response = await tenantAPI.getNotices();
      setNotices(response.data);
    } catch (error) {
      console.error("Failed to load notices:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      high: "badge-danger",
      normal: "badge-info",
      low: "badge-success",
    };
    return badges[priority] || "badge-info";
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Notices & Announcements</h1>

      {notices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No notices available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">{notice.title}</h3>
                <span className={`badge ${getPriorityBadge(notice.priority)}`}>
                  {notice.priority}
                </span>
              </div>
              
              <p className="text-gray-700 mb-3 whitespace-pre-wrap">{notice.message}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {notice.house_id ? "📍 House-specific" : "🌐 General announcement"}
                </span>
                <span>{new Date(notice.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
