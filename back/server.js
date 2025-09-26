// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const moleculeRoutes = require("./routes/moleculeRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // allow this frontend
    credentials: true,               // allow cookies if needed
  })
);

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.use("/api/users", userRoutes);
app.use("/api/molecules", moleculeRoutes);
app.use("/api/molecules", moleculeRoutes);
app.use("/api", quoteRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
