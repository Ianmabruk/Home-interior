import { useEffect, useState } from "react";
import { adminAPI } from "../../api";

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({ title: "", description: "", event_date: "" });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const response = await adminAPI.getEvents();
    setEvents(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await adminAPI.createEvent({ ...formData, event_date: formData.event_date + ":00" });
    setFormData({ title: "", description: "", event_date: "" });
    loadEvents();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Events</h1>
      
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Event</h2>
        <form onSubmit={handleSubmit}>
          <input className="input mb-4" placeholder="Event Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          <textarea className="input mb-4" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <input type="datetime-local" className="input mb-4" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} required />
          <button type="submit" className="btn">Create Event</button>
        </form>
      </div>

      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className="card border-l-4 border-green-500">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <p className="text-gray-700 mt-2">{event.description}</p>
            <p className="text-sm text-green-600 mt-2">📅 {new Date(event.event_date).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
