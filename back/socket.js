// socket.js
const Message = require("./models/Message");
const Quote = require("./models/Quote");
const User = require("./models/User");
const GlobalMessage = require("./models/GlobalMessage");

let io = null;

module.exports = {
  init: (server) => {
    io = require("socket.io")(server, {
      cors: {
        origin: [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
          "https://newveerix.vercel.app"
        ],
        methods: ["GET", "POST", "PATCH"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // 🔹 Customer joins quote-specific room
      socket.on("join_customer", (customerId) => {
        socket.join(`customer_${customerId}`);
        console.log(`Customer ${customerId} joined`);
      });

      // 🔹 Admin joins quote-specific room
      socket.on("join_admin", () => {
        socket.join("admin");
        console.log(`Admin joined admin room: ${socket.id}`);
      });

      // 🔹 Customer sends message (quote chat)
      socket.on("customer_message", async ({ quoteId, message, customerId }) => {
        if (!customerId) return;
        try {
          const payload = { quoteId, customerId, message, sender: "customer", time: new Date() };
          await Message.create(payload);

          const quote = await Quote.findById(quoteId).select("brandName");
          const customer = await User.findById(customerId).select("name");

          const notification = {
            ...payload,
            brandName: quote?.brandName || "Unknown",
            customerName: customer?.name || "Customer",
          };

          io.to(`customer_${customerId}`).emit("chat_message", { ...notification, target: "customer" });
          io.to("admin").emit("chat_message", { ...notification, target: "admin" });
        } catch (err) {
          console.error(err);
        }
      });

      // 🔹 Admin sends message (quote chat)
      socket.on("admin_message", async ({ quoteId, message, customerId }) => {
        if (!customerId) return;
        try {
          const payload = { quoteId, customerId, message, sender: "admin", time: new Date() };
          await Message.create(payload);

          const quote = await Quote.findById(quoteId).select("brandName");
          const customer = await User.findById(customerId).select("name");

          const notification = {
            ...payload,
            brandName: quote?.brandName || "Unknown",
            customerName: customer?.name || "Customer",
          };

          io.to(`customer_${customerId}`).emit("chat_message", { ...notification, target: "customer" });
          io.to("admin").emit("chat_message", { ...notification, target: "admin" });
        } catch (err) {
          console.error(err);
        }
      });

      // 🔹 Customer joins global support chat
      socket.on("join_global", (customerId) => {
        socket.join(`global_${customerId}`);
        console.log(`Customer ${customerId} joined global chat`);
      });

      // 🔹 Admin joins global support room
      socket.on("join_admin_global", () => {
        socket.join("admin_global");
        console.log(`Admin joined global chat room: ${socket.id}`);
      });

      // 🔹 Customer sends message in global chat
      socket.on("global_customer_message", async ({ customerId, message }) => {
        if (!customerId) return;
        try {
          const payload = { customerId, message, sender: "customer", time: new Date() };
          await GlobalMessage.create(payload);

          const customer = await User.findById(customerId).select("name");

          const notification = {
            ...payload,
            customerName: customer?.name || "Customer",
            type: "global",
          };

          io.to(`global_${customerId}`).emit("global_chat_message", { ...notification, target: "customer" });
          io.to("admin_global").emit("global_chat_message", { ...notification, target: "admin" });
        } catch (err) {
          console.error("Error in global_customer_message:", err);
        }
      });

      // 🔹 Admin sends message in global chat
      socket.on("global_admin_message", async ({ customerId, message }) => {
        if (!customerId) return;
        try {
          const payload = { customerId, message, sender: "admin", time: new Date() };
          await GlobalMessage.create(payload);

          const customer = await User.findById(customerId).select("name");

          const notification = {
            ...payload,
            customerName: customer?.name || "Customer",
            type: "global",
          };

          io.to(`global_${customerId}`).emit("global_chat_message", { ...notification, target: "customer" });
          io.to("admin_global").emit("global_chat_message", { ...notification, target: "admin" });
        } catch (err) {
          console.error("Error in global_admin_message:", err);
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  },
};
