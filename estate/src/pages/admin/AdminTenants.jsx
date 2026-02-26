import { useEffect, useState } from "react";
import { adminAPI } from "../../api";

export default function AdminTenants() {
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    const response = await adminAPI.getTenants();
    setTenants(response.data);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Tenants</h1>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">House</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr key={tenant.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{tenant.email}</td>
                <td className="p-3">{tenant.phone}</td>
                <td className="p-3">House {tenant.house_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
