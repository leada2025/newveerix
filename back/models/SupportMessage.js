// models/SupportMessage.js
const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: String, enum: ["admin", "customer"], required: true },
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SupportMessage", supportMessageSchema);
