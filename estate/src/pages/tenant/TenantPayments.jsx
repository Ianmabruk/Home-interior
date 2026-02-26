import { useEffect, useState } from "react";
import { tenantAPI } from "../../api";

export default function TenantPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await tenantAPI.getPayments();
      setPayments(response.data);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const unpaidPayments = payments.filter(p => !p.paid);
  const paidPayments = payments.filter(p => p.paid);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Payments</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-gray-600 text-sm">Total Due</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            KES {unpaidPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Unpaid Bills</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{unpaidPayments.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Paid This Year</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{paidPayments.length}</p>
        </div>
      </div>

      {/* Unpaid Payments */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Pending Payments</h2>
        {unpaidPayments.length === 0 ? (
          <p className="text-gray-600">No pending payments. You're all caught up! 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Due Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {unpaidPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{payment.description}</td>
                    <td className="py-3 px-4 font-semibold">KES {payment.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">{payment.due_date}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-danger">Unpaid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paid Payments */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-green-600">Payment History</h2>
        {paidPayments.length === 0 ? (
          <p className="text-gray-600">No payment history</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Paid Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {paidPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{payment.description}</td>
                    <td className="py-3 px-4 font-semibold">KES {payment.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">{payment.paid_date}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-success">Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
