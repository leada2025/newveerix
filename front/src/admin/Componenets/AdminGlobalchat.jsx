import React, { useState, useEffect, useRef } from "react";
import socket from "../../Components/Socket";
import { FaArrowLeft } from "react-icons/fa";
import axios from "../../api/Axios";

export default function AdminGlobalChat() {
  const [chats, setChats] = useState({}); // { customerId: { messages: [], unread: number, name: string } }
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null); // 🔹 ref to detect outside clicks

  // 🔹 Fetch all previous messages grouped by customer along with unread counts
  useEffect(() => {
    axios
      .get("/api/globalChat/all")
      .then((res) => {
        setChats((prev) => {
          const grouped = {};
          res.data.forEach((msg) => {
            if (!grouped[msg.customerId]) {
              grouped[msg.customerId] = {
                messages: [],
                unread: msg.adminUnread || 0,
                name: msg.customerName || msg.customerId,
              };
            }
            grouped[msg.customerId].messages.push(msg);
          });

          // Reset unread for active customer
          if (activeCustomer && grouped[activeCustomer])
            grouped[activeCustomer].unread = 0;

          return grouped;
        });
      })
      .catch((err) => console.error("Error fetching all chats:", err));
  }, [activeCustomer]);

  // 🔹 Socket connection
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleConnect = () => socket.emit("join_admin_global");
    if (socket.connected) handleConnect();
    socket.on("connect", handleConnect);

    const handler = (payload) => {
      if (!payload.customerId) return;

      setChats((prev) => {
        const prevData = prev[payload.customerId] || {
          messages: [],
          unread: 0,
          name: payload.customerName || payload.customerId,
        };

        const unreadIncrement =
          payload.sender === "customer" &&
          activeCustomer !== payload.customerId
            ? 1
            : 0;

        return {
          ...prev,
          [payload.customerId]: {
            ...prevData,
            messages: [...prevData.messages, payload],
            unread: prevData.unread + unreadIncrement,
          },
        };
      });
    };

    socket.on("global_chat_message", handler);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("global_chat_message", handler);
    };
  }, [activeCustomer]);

  // 🔹 Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeCustomer, chats]);

  // 🔹 Outside click handler
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (chatBoxRef.current && !chatBoxRef.current.contains(e.target)) {
        setOpen(false);
        setActiveCustomer(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || !activeCustomer) return;

    const message = {
      customerId: activeCustomer,
      message: input,
      sender: "admin",
      time: new Date().toISOString(),
    };

    try {
      socket.emit("global_admin_message", message);
    } catch (err) {
      console.error("Error sending admin message:", err);
    }

    setInput("");
  };

  const openCustomerChat = async (id) => {
    setActiveCustomer(id);

    try {
      await axios.post(`/api/globalChat/reset-unread/${id}`);
    } catch (err) {
      console.error("Failed to reset unread count", err);
    }

    setChats((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        unread: 0,
      },
    }));
  };

  const totalUnreadCustomers = Object.values(chats).filter(
    (chat) => chat.unread > 0
  ).length;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end font-sans">
      {/* Floating Chat Button */}
      <button
        className="relative bg-[#d1383a] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#a31d06] transition"
        onClick={() => setOpen(!open)}
      >
        Chat
        {totalUnreadCustomers > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-[#d1383a] text-xs font-bold px-2 py-0.5 rounded-full shadow">
            {totalUnreadCustomers}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          ref={chatBoxRef} // 👈 for outside click detection
          className="mt-2 w-[440px] max-w-full h-[540px] bg-white rounded-lg shadow-xl flex overflow-hidden border"
        >
          {/* Sidebar */}
          {!activeCustomer && (
            <div className="w-56 bg-gradient-to-b from-[#fafafa] to-[#f0f0f0] p-3 border-r border-gray-200 flex flex-col overflow-y-auto">
              <h2 className="text-[#d1383a] font-semibold text-center mb-3 text-lg">
                Active Chats
              </h2>
              {Object.keys(chats).length === 0 && (
                <p className="text-gray-400 text-sm text-center mt-4">
                  No active chats
                </p>
              )}
              {Object.keys(chats).map((id) => {
                const { unread, name } = chats[id];
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const isActive = activeCustomer === id;

                return (
                  <button
                    key={id}
                    onClick={() => openCustomerChat(id)}
                    className={`flex items-center justify-between w-full mb-2 p-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-[#d1383a] text-white shadow-md"
                        : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#d1383a]/10 text-[#d1383a]"
                        }`}
                      >
                        {initials}
                      </div>
                      <span className="truncate font-medium text-sm">
                        {name}
                      </span>
                    </div>
                    {unread > 0 && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white text-[#d1383a]"
                            : "bg-[#d1383a] text-white"
                        }`}
                      >
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat Window */}
          {activeCustomer && (
            <div className="flex-1 flex flex-col">
              <div className="bg-[#d1383a] text-white flex items-center justify-between p-3">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setActiveCustomer(null)}
                >
                  <FaArrowLeft />
                  <span className="font-semibold truncate">
                    {chats[activeCustomer]?.name}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto bg-[#f9f9f9] space-y-3">
                {chats[activeCustomer]?.messages.map((m, i) => {
                  const isAdmin = m.sender === "admin";
                  const time = new Date(m.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={i}
                      className={`flex w-full ${
                        isAdmin ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`relative max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed ${
                          isAdmin
                            ? "bg-[#d1383a] text-white rounded-br-none"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                        }`}
                      >
                        <div>{m.message}</div>
                        <div
                          className={`text-[10px] mt-1 ${
                            isAdmin
                              ? "text-white/70 text-right"
                              : "text-gray-500 text-left"
                          }`}
                        >
                          {time}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex p-3 border-t border-gray-200 gap-2 bg-white">
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
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
