import React, { useState, useEffect, useRef } from "react";
import socket from "../../Components/Socket";
import { 
  ArrowLeft, 
  MessageCircle, 
  Send, 
  Search, 
  X,
  Users,
  Clock,
  MoreVertical
} from "lucide-react";
import axios from "../../api/Axios";

export default function AdminGlobalChat() {
  const [chats, setChats] = useState({});
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Format time function
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format last message time for sidebar
  const formatLastSeen = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // 🔹 Fetch all previous messages grouped by customer along with unread counts
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/globalChat/all");
        setChats((prev) => {
          const grouped = {};
          res.data.forEach((msg) => {
            if (!grouped[msg.customerId]) {
              grouped[msg.customerId] = {
                messages: [],
                unread: msg.adminUnread || 0,
                name: msg.customerName || msg.customerId,
                lastMessage: msg.time,
                lastMessageText: msg.message
              };
            }
            grouped[msg.customerId].messages.push(msg);
            // Update last message if this one is newer
            if (new Date(msg.time) > new Date(grouped[msg.customerId].lastMessage)) {
              grouped[msg.customerId].lastMessage = msg.time;
              grouped[msg.customerId].lastMessageText = msg.message;
            }
          });

          // Reset unread for active customer
          if (activeCustomer && grouped[activeCustomer]) {
            grouped[activeCustomer].unread = 0;
          }

          return grouped;
        });
      } catch (err) {
        console.error("Error fetching all chats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
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
          lastMessage: payload.time,
          lastMessageText: payload.message
        };

        const unreadIncrement =
          payload.sender === "customer" &&
          activeCustomer !== payload.customerId
            ? 1
            : 0;

        const updatedMessages = [...prevData.messages, payload];
        
        return {
          ...prev,
          [payload.customerId]: {
            ...prevData,
            messages: updatedMessages,
            unread: prevData.unread + unreadIncrement,
            lastMessage: payload.time,
            lastMessageText: payload.message
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

  // Filter chats based on search
  const filteredChats = Object.entries(chats).filter(([id, chat]) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnreadCustomers = Object.values(chats).filter(
    (chat) => chat.unread > 0
  ).length;

  // Sort chats by last message time
  const sortedChats = filteredChats.sort(([,a], [,b]) => 
    new Date(b.lastMessage) - new Date(a.lastMessage)
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Floating Chat Button */}
      <button
        className="relative bg-[#d1383a] text-white p-4 rounded-full shadow-2xl hover:shadow-xl hover:scale-105 transition-all duration-200 group"
        onClick={() => setOpen(!open)}
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnreadCustomers > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-[#d1383a] text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-gray-100 min-w-[20px] flex items-center justify-center">
            {totalUnreadCustomers}
          </span>
        )}
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Customer Support Chat
        </div>
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          ref={chatBoxRef}
          className="mt-2 w-[440px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
        >
          {/* Header */}
          {!activeCustomer ? (
            <div className="bg-gradient-to-r from-[#d1383a] to-[#b52f30] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Customer Chats</h2>
                    <p className="text-white/80 text-sm">
                      {Object.keys(chats).length} active conversations
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#d1383a] to-[#b52f30] p-4 text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveCustomer(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
                    {chats[activeCustomer]?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {chats[activeCustomer]?.name}
                    </h3>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Online
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            {!activeCustomer && (
              <div className="w-full bg-gray-50 flex flex-col">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d1383a]"></div>
                  </div>
                ) : sortedChats.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                    <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-1">No conversations</p>
                    <p className="text-sm text-center">
                      {searchTerm ? "No customers match your search" : "Customer messages will appear here"}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {sortedChats.map(([id, chat]) => {
                      const initials = chat.name
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
                          className={`flex items-center gap-3 w-full p-3 border-b border-gray-100 hover:bg-white transition-colors duration-200 ${
                            isActive ? "bg-white border-l-4 border-l-[#d1383a]" : ""
                          }`}
                        >
                          <div className="relative">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                                isActive
                                  ? "bg-[#d1383a] text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {initials}
                            </div>
                            {chat.unread > 0 && (
                              <span className="absolute -top-1 -right-1 bg-[#d1383a] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] border-2 border-white">
                                {chat.unread}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {chat.name}
                              </h4>
                              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {formatLastSeen(chat.lastMessage)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {chat.lastMessageText || "No messages yet"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Chat Window */}
            {activeCustomer && chats[activeCustomer] && (
              <div className="flex-1 flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-white to-gray-50/30 space-y-4">
                  {chats[activeCustomer].messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-1">No messages yet</p>
                      <p className="text-sm">Start a conversation with {chats[activeCustomer].name}</p>
                    </div>
                  ) : (
                    chats[activeCustomer].messages.map((m, i) => {
                      const isAdmin = m.sender === "admin";
                      const time = formatTime(m.time);

                      return (
                        <div
                          key={i}
                          className={`flex w-full ${
                            isAdmin ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className={`flex max-w-[85%] gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                            {!isAdmin && (
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-1">
                                {chats[activeCustomer].name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                            )}
                            <div
                              className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                                isAdmin
                                  ? "bg-gradient-to-br from-[#d1383a] to-[#b52f30] text-white rounded-br-none"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                              }`}
                            >
                              <div className="text-sm leading-relaxed">{m.message}</div>
                              <div
                                className={`text-xs mt-2 ${
                                  isAdmin
                                    ? "text-white/70 text-right"
                                    : "text-gray-500 text-left"
                                }`}
                              >
                                {time}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                      className="bg-[#d1383a] text-white p-3 rounded-xl hover:bg-[#b52f30] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={sendMessage}
                      disabled={!input.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}