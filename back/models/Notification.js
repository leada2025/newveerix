const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["quote", "message", "system"], default: "quote" },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null }, // e.g. quoteId or messageId
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
