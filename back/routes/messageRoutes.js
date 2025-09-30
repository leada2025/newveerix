const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// Get all messages for a quote
router.get("/:quoteId", async (req, res) => {
  try {
    const messages = await Message.find({ quoteId: req.params.quoteId }).sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
