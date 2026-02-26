import { useEffect, useState } from "react";
import { adminAPI } from "../../api";

export default function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [houses, setHouses] = useState([]);
  const [formData, setFormData] = useState({ title: "", message: "", house_id: "", priority: "normal" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [noticesRes, housesRes] = await Promise.all([adminAPI.getNotices(), adminAPI.getHouses()]);
    setNotices(noticesRes.data);
    setHouses(housesRes.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await adminAPI.sendNotice({ ...formData, house_id: formData.house_id || null });
    setFormData({ title: "", message: "", house_id: "", priority: "normal" });
    loadData();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Notices & Announcements</h1>
      
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Send Notice</h2>
        <form onSubmit={handleSubmit}>
          <input className="input mb-4" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          <textarea className="input mb-4" rows={4} placeholder="Message" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
          <select className="input mb-4" value={formData.house_id} onChange={e => setFormData({...formData, house_id: e.target.value})}>
            <option value="">All Houses (General)</option>
            {houses.map(h => <option key={h.id} value={h.id}>House {h.number}</option>)}
          </select>
          <select className="input mb-4" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
          <button type="submit" className="btn">Send Notice</button>
        </form>
      </div>

      <div className="space-y-4">
        {notices.map(notice => (
          <div key={notice.id} className="card">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{notice.title}</h3>
              <span className={`badge badge-${notice.priority === 'high' ? 'danger' : 'info'}`}>{notice.priority}</span>
            </div>
            <p className="text-gray-700 mt-2">{notice.message}</p>
            <p className="text-sm text-gray-500 mt-2">{notice.house_id ? `House ${notice.house_id}` : 'All Houses'} • {new Date(notice.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
