// src/Components/Socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // your backend
const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
});

// 🔹 Safe connection initializer
export const connectSocket = (user) => {
  if (!socket.connected) socket.connect();

  if (user?.role === "admin") {
    // Admin joins both normal and global admin rooms
    socket.emit("join_admin");
    socket.emit("join_admin_global");
    console.log("✅ Admin joined both admin and global admin rooms");
  } else if (user?._id) {
    // Customer joins normal + global rooms
    socket.emit("join_customer", user._id);
    socket.emit("join_global", user._id);
    console.log(`✅ Customer ${user._id} joined global chat`);
  }

  console.log("✅ Socket connected and rooms joined");
};

// 🔹 Clean disconnect
export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export default socket;
