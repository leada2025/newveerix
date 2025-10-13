const express = require("express");
const router = express.Router();
const SupportMessage = require("../models/SupportMessage");
const mongoose = require("mongoose");

// Get message history for a customer
router.get("/:customerId", async (req, res) => {
  const { customerId } = req.params;

  // ✅ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ message: "Invalid customerId" });
  }

  try {
    const messages = await SupportMessage.find({ customerId }).sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Optional: Save message (REST API, in case you want to save messages via HTTP)
router.post("/", async (req, res) => {
  const { customerId, sender, message } = req.body;

  if (!customerId || !sender || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ message: "Invalid customerId" });
  }

  try {
    const newMsg = new SupportMessage({ customerId, sender, message });
    await newMsg.save();
    res.json(newMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
