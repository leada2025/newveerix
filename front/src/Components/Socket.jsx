// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Replace with your server URL

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
export const joinSupportRoom = ({ role, _id }) => {
  if (!socket.connected) socket.connect();

  if (role === "admin") {
    socket.emit("join_support_admin");
    console.log("🟢 Admin joined support room");
  } else if (role === "customer" && _id) {
    socket.emit("join_support_customer", _id);
    console.log(`🟢 Customer ${_id} joined support room`);
  }
};

// 🧩 Optional helper — disconnect cleanly
export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export default socket;
