// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
});

// 🧠 Optional helper — connect safely
export const connectSocket = (user) => {
  if (!socket.connected) socket.connect();

  if (user?.role === "admin") {
    socket.emit("join_admin");
  } else if (user?._id) {
    socket.emit("join_customer", user._id);
  }
  console.log("✅ Socket connected and room joined");
};

// 🧩 Optional helper — disconnect cleanly
export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export default socket;
