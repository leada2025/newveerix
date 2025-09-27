// socket.js
let io = null;

module.exports = {
  init: (server) => {
    io = require("socket.io")(server, {
      cors: {
        origin: "http://localhost:5173",
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
