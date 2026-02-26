import { useEffect, useState } from "react";
import { chatAPI } from "../../api";

export default function TenantChat() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadConversation(selectedUser.id);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      const response = await chatAPI.getUsers();
      setUsers(response.data);
      if (response.data.length > 0) {
        setSelectedUser(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (userId) => {
    try {
      const response = await chatAPI.getConversation(userId);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await chatAPI.sendMessage({
        receiver_id: selectedUser.id,
        text: newMessage,
      });
      setNewMessage("");
      loadConversation(selectedUser.id);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const currentUserId = JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Chat with Admin</h1>

      <div className="card h-[600px] flex flex-col">
        {/* User Selection (if multiple admins exist) */}
        {users.length > 1 && (
          <div className="border-b border-gray-200 p-4">
            <select
              className="input"
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const user = users.find(u => u.id === parseInt(e.target.value));
                setSelectedUser(user);
              }}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email} ({user.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-gray-600">No messages yet. Start a conversation!</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUserId
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(message.time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
