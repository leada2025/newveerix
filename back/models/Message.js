// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote", required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: String, enum: ["customer", "admin"], required: true },
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
