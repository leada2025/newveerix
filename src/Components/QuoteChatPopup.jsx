import React, { useState, useEffect, useRef } from "react";
import socket from "./Socket";
import axios from "../api/Axios";
import { MessageSquare, X } from "lucide-react";

export default function QuoteChatPopup({ quoteId, customerId, onClose, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const handlerRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch chat history when popup opens or quoteId changes
  useEffect(() => {
    if (!quoteId) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${quoteId}`);
        // Sort by time ascending
        const sorted = res.data.sort((a, b) => new Date(a.time) - new Date(b.time));
        setMessages(sorted);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    fetchMessages();
  }, [quoteId]);

  // Join room and listen for new messages - reset handler on quoteId change
  useEffect(() => {
    if (!socket.connected) socket.connect();

    if (isAdmin) {
      socket.emit("join_admin");
    } else {
      socket.emit("join_customer", customerId);
    }

    // Remove previous handler if any
    if (handlerRef.current) {
      socket.off("chat_message", handlerRef.current);
      handlerRef.current = null;
    }

    // Setup new handler
    handlerRef.current = ({ quoteId: qId, message, sender, time }) => {
      if (qId === quoteId) {
        setMessages((prev) => {
          // Deduplicate by message + time + sender (adjust if you have unique IDs)
          const exists = prev.some(
            (m) => m.message === message && m.time === time && m.sender === sender
          );
          if (exists) return prev;

          const newMessages = [...prev, { message, sender, time }];
          // Sort after adding
          return newMessages.sort((a, b) => new Date(a.time) - new Date(b.time));
        });
      }
    };

    socket.on("chat_message", handlerRef.current);

    // Cleanup on unmount or quoteId change
    return () => {
      if (handlerRef.current) {
        socket.off("chat_message", handlerRef.current);
        handlerRef.current = null;
      }
    };
  }, [quoteId, customerId, isAdmin]);

  const sendMessage = () => {
    if (!input.trim()) return;

    console.log("Sending message:", input); // For debugging duplicate sends

    socket.emit(isAdmin ? "admin_message" : "customer_message", {
      quoteId,
      customerId,
      message: input.trim(),
    });

    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-lg flex flex-col overflow-hidden z-50 border border-gray-300">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-3 flex justify-between items-center">
        <span className="font-semibold">Chat</span>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto max-h-64 space-y-2 bg-gray-50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === "customer" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-2 rounded-lg max-w-[70%] text-sm ${
                m.sender === "customer"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-800 border"
              }`}
            >
              {m.message}
              <div className="text-xs text-gray-400 mt-1 text-right">
                {new Date(m.time).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex p-2 border-t border-gray-200 gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-600"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="px-3 py-2 bg-emerald-600 text-white rounded-full"
        >
            Send
        </button>
      </div>
    </div>
  );
}
