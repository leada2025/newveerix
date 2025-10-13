import React, { useState, useEffect, useRef } from "react";
import socket, { joinSupportRoom } from "../Components/Socket";
import axios from "../api/Axios";
import { X } from "lucide-react";

export default function SupportChatPopup({ customerId, onClose, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    joinSupportRoom({ _id: customerId, role: isAdmin ? "admin" : "customer" });

    // Fetch message history
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/support/${customerId}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();

    const handler = (msg) => {
      if (msg.customerId !== customerId) return;
      if (isAdmin && msg.target !== "admin") return;
      if (!isAdmin && msg.target !== "customer") return;

      setMessages((prev) => [...prev, msg]);
    };

    socket.on("support_chat", handler);

    // debug
    socket.onAny((event, data) => console.log("📩 Event:", event, data));

    return () => {
      socket.off("support_chat", handler);
      socket.offAny();
    };
  }, [customerId, isAdmin]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit(isAdmin ? "support_admin_message" : "support_customer_message", {
      customerId,
      message: input.trim(),
    });
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-20 right-5 w-80 bg-white rounded-xl shadow-lg flex flex-col z-[9999]">
      <div className="bg-emerald-600 text-white p-3 flex justify-between items-center">
        <span>Support Chat</span>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto max-h-64 bg-gray-50 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.sender === (isAdmin ? "admin" : "customer")
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`p-2 rounded-lg max-w-[70%] text-sm ${
                m.sender === (isAdmin ? "admin" : "customer")
                  ? "bg-emerald-600 text-white"
                  : "bg-white border"
              }`}
            >
              {m.message}
              <div className="text-xs text-gray-400 mt-1 text-right">
                {new Date(m.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex p-2 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full p-2 text-sm focus:ring-2 focus:ring-emerald-600"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-3 py-2 bg-emerald-600 text-white rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}
