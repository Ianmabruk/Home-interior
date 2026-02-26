import { useEffect, useState } from "react";
import { tenantAPI } from "../../api";

export default function TenantEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await tenantAPI.getEvents();
      setEvents(response.data);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.event_date) > now);
  const pastEvents = events.filter(e => new Date(e.event_date) <= now);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Events & Calendar</h1>

      {/* Upcoming Events */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-600">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <div className="card">
            <p className="text-gray-600">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="card border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                {event.description && (
                  <p className="text-gray-700 mb-3">{event.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium">
                    📅 {new Date(event.event_date).toLocaleString()}
                  </span>
                  <span className="text-gray-500">
                    {event.house_id ? "House-specific" : "All residents"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-600">Past Events</h2>
          <div className="space-y-4">
            {pastEvents.map((event) => (
              <div key={event.id} className="card opacity-75">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{event.title}</h3>
                {event.description && (
                  <p className="text-gray-600 mb-3 text-sm">{event.description}</p>
                )}
                <span className="text-sm text-gray-500">
                  {new Date(event.event_date).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
