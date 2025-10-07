// socket.js
const Message = require("./models/Message"); 
const Quote = require("./models/Quote");
let io = null;
const User = require("./models/User"); 
module.exports = {
  init: (server) => {
    io = require("socket.io")(server, {
      cors: {
       origin: ["http://localhost:5173","http://localhost:5174", "https://newveerix.vercel.app"],
        methods: ["GET", "POST", "PATCH"],
        credentials: true,
      },
    });

 io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Customer joins their room
  socket.on("join_customer", (customerId) => {
    socket.join(`customer_${customerId}`);
    console.log(`Customer ${customerId} joined`);
  });

  // Admin joins admin room
  socket.on("join_admin", () => {
    socket.join("admin");
    console.log(`Admin joined admin room: ${socket.id}`);
  });



    // Customer message
  socket.on("customer_message", async ({ quoteId, message, customerId }) => {
        if (!customerId) return;
        try {
          const payload = { quoteId, customerId, message, sender: "customer", time: new Date() };
          await Message.create(payload);

          const quote = await Quote.findById(quoteId).select("brandName");
          const customer = await User.findById(customerId).select("name"); // <--- get customer name

          const notification = {
            ...payload,
            brandName: quote?.brandName || "Unknown",
            customerName: customer?.name || "Customer", // <--- include name
          };

    io.to(`customer_${customerId}`).emit("chat_message", { ...notification, target: "customer" });
io.to("admin").emit("chat_message", { ...notification, target: "admin" });
        } catch (err) {
          console.error(err);
        }
      });

      // Admin message
      socket.on("admin_message", async ({ quoteId, message, customerId }) => {
        if (!customerId) return;
        try {
          const payload = { quoteId, customerId, message, sender: "admin", time: new Date() };
          await Message.create(payload);

          const quote = await Quote.findById(quoteId).select("brandName");
          const customer = await User.findById(customerId).select("name"); // <--- get customer name

          const notification = {
            ...payload,
            brandName: quote?.brandName || "Unknown",
            customerName: customer?.name || "Customer", // <--- include name
          };

       io.to(`customer_${customerId}`).emit("chat_message", { ...notification, target: "customer" });
io.to("admin").emit("chat_message", { ...notification, target: "admin" });
        } catch (err) {
          console.error(err);
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
