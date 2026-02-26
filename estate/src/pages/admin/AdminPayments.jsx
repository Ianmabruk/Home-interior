import { useEffect, useState } from "react";
import { adminAPI } from "../../api";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [houses, setHouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ amount: "", due_date: "", house_id: "", description: "Rent payment" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [paymentsRes, housesRes] = await Promise.all([adminAPI.getPayments(), adminAPI.getHouses()]);
    setPayments(paymentsRes.data);
    setHouses(housesRes.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await adminAPI.createPayment(formData);
    setShowForm(false);
    loadData();
  };

  return (
    <div>
      <div className="flex justify-between mb-8">
        <h1 className="text-3xl font-bold">Payments</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-600 text-white px-6 py-2 rounded-lg">Add Payment</button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <form onSubmit={handleSubmit}>
            <select className="input mb-4" value={formData.house_id} onChange={e => setFormData({...formData, house_id: e.target.value})} required>
              <option value="">Select House</option>
              {houses.map(h => <option key={h.id} value={h.id}>House {h.number}</option>)}
            </select>
            <input type="number" className="input mb-4" placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
            <input type="date" className="input mb-4" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} required />
            <input className="input mb-4" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <button type="submit" className="btn">Create Payment</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">House</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Due Date</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} className="border-b">
                <td className="p-3">House {payment.house_id}</td>
                <td className="p-3">KES {payment.amount}</td>
                <td className="p-3">{payment.due_date}</td>
                <td className="p-3"><span className={`badge ${payment.paid ? 'badge-success' : 'badge-danger'}`}>{payment.paid ? 'Paid' : 'Unpaid'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
