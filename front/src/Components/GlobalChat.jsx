// GlobalChat.jsx
import React, { useState, useEffect, useRef } from "react";
import socket from "../Components/Socket";

export default function GlobalChat({ customerId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!customerId) return;

    if (!socket.connected) socket.connect();

    const handleConnect = () => socket.emit("join_global", customerId);
    if (socket.connected) handleConnect();
    socket.on("connect", handleConnect);

    const handler = (payload) => setMessages((prev) => [...prev, payload]);
    socket.on("global_chat_message", handler);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("global_chat_message", handler);
    };
  }, [customerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = { customerId, message: input, sender: "customer", time: new Date().toISOString() };
    setMessages((prev) => [...prev, msg]);
    socket.emit("global_customer_message", { customerId, message: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">No messages yet. Start a conversation!</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "customer" ? "justify-end" : "justify-start"} mb-2`}>
              <div
                className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${
                  m.sender === "customer" ? "bg-[#d1383a] text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                <div>{m.message}</div>
                <div className={`text-xs mt-1 ${m.sender === "customer" ? "text-white/70" : "text-gray-500"}`}>
                  {m.sender === "customer" ? "You" : "Support"} • {new Date(m.time).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex p-2 border-t border-gray-200 bg-white gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#d1383a]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-[#d1383a] text-white px-4 py-2 rounded-lg hover:bg-[#a31d06] transition"
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
