import React, { useState, useEffect, useRef } from "react";
import socket, { joinSupportRoom } from "../../Components/Socket";
import { X } from "lucide-react";
import axios from "../../api/Axios"; // axios instance for API calls

export default function AdminSupportChat({ onClose }) {
  const [customerId, setCustomerId] = useState("");
  const [activeCustomers, setActiveCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  // Join admin support room
 useEffect(() => {
  joinSupportRoom({ role: "admin" });

  const handler = (msg) => {
    if (!msg.customerId) return;

    setMessages((prev) => [...prev, msg]);

    if (msg.sender === "customer") {
      setActiveCustomers((prev) => {
        if (!prev.find((c) => c._id === msg.customerId)) {
          return [
            ...prev,
            { _id: msg.customerId, name: msg.customerName || `Customer-${msg.customerId}` },
          ];
        }
        return prev;
      });

      if (msg.customerId !== customerId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.customerId]: prev[msg.customerId] + 1 || 1,
        }));
      }
    }
  };

  socket.on("support_chat", handler);

  return () => socket.off("support_chat", handler);
}, [customerId]); // ❌ should be []

  // Fetch message history whenever a customer is selected
  useEffect(() => {
    if (!customerId) return;

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/support/${customerId}`);
        setMessages(res.data);
        // reset unread count
        setUnreadCounts((prev) => ({ ...prev, [customerId]: 0 }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [customerId]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !customerId) return;
    socket.emit("support_admin_message", { customerId, message: input.trim() });
    setInput("");
    setUnreadCounts((prev) => ({ ...prev, [customerId]: 0 }));
  };

  return (
    <div className="fixed bottom-20 right-5 w-96 bg-white rounded-xl shadow-lg flex flex-col z-[9999]">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-3 flex justify-between items-center">
        <span>Admin Support Chat</span>
        <button onClick={onClose}><X className="w-5 h-5" /></button>
      </div>

      {/* Active Customers List */}
      <div className="p-2 border-b max-h-32 overflow-y-auto">
        {activeCustomers.length === 0 && <p className="text-gray-400 text-sm">No active chats</p>}
        {activeCustomers.map((c) => (
          <button
            key={c._id}
            className={`w-full text-left p-1 rounded flex justify-between items-center ${
              c._id === customerId ? "bg-emerald-100" : "hover:bg-gray-100"
            }`}
            onClick={() => setCustomerId(c._id)}
          >
            <span>{c.name}</span>
            {unreadCounts[c._id] > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 rounded-full text-xs">
                {unreadCounts[c._id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-3 overflow-y-auto max-h-64 bg-gray-50 space-y-2">
        {messages
          .filter((m) => m.customerId === customerId)
          .map((m, i) => (
            <div key={i} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={`p-2 rounded-lg max-w-[70%] text-sm ${
                m.sender === "admin" ? "bg-emerald-600 text-white" : "bg-white border"
              }`}>
                {m.message}
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex p-2 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full p-2 text-sm focus:ring-2 focus:ring-emerald-600"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="ml-2 px-3 py-2 bg-emerald-600 text-white rounded-full">
          Send
        </button>
      </div>
    </div>
  );
}
