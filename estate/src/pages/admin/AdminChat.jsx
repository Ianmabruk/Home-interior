import { useEffect, useState } from "react";
import { chatAPI } from "../../api";

export default function AdminChat() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      loadConversation(selectedTenant.id);
    }
  }, [selectedTenant]);

  const loadTenants = async () => {
    const response = await chatAPI.getUsers();
    setTenants(response.data);
    if (response.data.length > 0) setSelectedTenant(response.data[0]);
  };

  const loadConversation = async (tenantId) => {
    const response = await chatAPI.getConversation(tenantId);
    setMessages(response.data);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await chatAPI.sendMessage({ receiver_id: selectedTenant.id, text: newMessage });
    setNewMessage("");
    loadConversation(selectedTenant.id);
  };

  const currentUserId = JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Chat with Tenants</h1>
      
      <div className="card h-[600px] flex">
        <div className="w-1/4 border-r p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Tenants</h3>
          {tenants.map(tenant => (
            <div key={tenant.id} className={`p-3 rounded cursor-pointer ${selectedTenant?.id === tenant.id ? 'bg-green-100' : 'hover:bg-gray-100'}`} onClick={() => setSelectedTenant(tenant)}>
              <p className="font-medium">{tenant.email}</p>
              <p className="text-xs text-gray-500">House {tenant.house_id}</p>
            </div>
          ))}
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md px-4 py-2 rounded-lg ${msg.sender_id === currentUserId ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  <p>{msg.text}</p>
                  <p className="text-xs mt-1 opacity-75">{new Date(msg.time).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSend} className="border-t p-4">
            <div className="flex space-x-2">
              <input className="input flex-1" placeholder="Type message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg">Send</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
