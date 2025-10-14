// routes/globalChat.js
const express = require("express");
const router = express.Router();
const GlobalMessage = require("../models/GlobalMessage");

// ✅ Get all messages for a specific customer
router.get("/:customerId", async (req, res) => {
  try {
    const messages = await GlobalMessage.find({ customerId: req.params.customerId })
      .sort({ time: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching global messages:", err);
    res.status(500).json({ error: "Server error fetching messages" });
  }
});

// ✅ Save a new message
router.post("/", async (req, res) => {
  try {
    const { customerId, message, sender } = req.body;

    if (!customerId || !message || !sender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMessage = new GlobalMessage({ customerId, message, sender });
    await newMessage.save();

    // emit socket event to both parties (optional)
    req.app.get("io").emit("global_message", newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error saving global message:", err);
    res.status(500).json({ error: "Server error saving message" });
  }
});

module.exports = router;
