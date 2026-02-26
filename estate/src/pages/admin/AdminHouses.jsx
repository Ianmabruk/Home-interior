// Simplified admin pages - full implementation follows the same pattern as tenant pages
import { useEffect, useState } from "react";
import { adminAPI } from "../../api";

export default function AdminHouses() {
  const [houses, setHouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ number: "", owner: "", status: "vacant" });

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    const response = await adminAPI.getHouses();
    setHouses(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await adminAPI.createHouse(formData);
    setFormData({ number: "", owner: "", status: "vacant" });
    setShowForm(false);
    loadHouses();
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this house?")) {
      await adminAPI.deleteHouse(id);
      loadHouses();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Houses</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-600 text-white px-6 py-2 rounded-lg">
          {showForm ? "Cancel" : "Add House"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <form onSubmit={handleSubmit}>
            <input className="input mb-4" placeholder="House Number" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required />
            <input className="input mb-4" placeholder="Owner Name" value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
            <select className="input mb-4" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
            <button type="submit" className="btn">Create House</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {houses.map(house => (
          <div key={house.id} className="card">
            <h3 className="text-xl font-bold text-green-600">House {house.number}</h3>
            <p className="text-gray-600 mt-2">Owner: {house.owner || "N/A"}</p>
            <span className={`badge mt-2 ${house.status === 'occupied' ? 'badge-success' : 'badge-warning'}`}>{house.status}</span>
            <button onClick={() => handleDelete(house.id)} className="mt-4 text-red-600 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
