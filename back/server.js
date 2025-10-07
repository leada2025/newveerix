const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

const userRoutes = require("./routes/userRoutes");
const moleculeRoutes = require("./routes/moleculeRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const socket = require("./socket"); // ✅ import socket helper
const messageRoutes = require("./routes/messageRoutes"); 
const roleRoutes = require("./routes/roleRoutes")
const notificationRoutes =require("./routes/notificationRoutes")
dotenv.config();

const app = express();
app.use(express.json());


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://newveerix.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// ✅ Optional, but safe fallback for Express 5:
app.options(/.*/, cors(corsOptions));



mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/users", userRoutes);
app.use("/api/molecules", moleculeRoutes);
app.use("/api", quoteRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/notifications",notificationRoutes)
const server = http.createServer(app);

// Initialize socket.io
const io = socket.init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
