// routes/quoteRoutes.js
const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const socket = require("../socket");  // socket.io instance
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const Notification = require("../models/Notification");
// ---------- Helper: Emit update ----------
const emitQuoteUpdate = async(quote, change = {}) => {
  if (!quote?.customerId) return;
  const io = socket.getIO();

  const customerIdStr = quote.customerId._id ? quote.customerId._id.toString() : quote.customerId.toString();

  await Notification.create({
    userId: quote.customerId,
    title: "Quote Update",
    message: change.message || `Quote status updated to ${quote.status}`,
    type: "quote",
    relatedId: quote._id
  });
  // 👤 Notify customer
  io.to(`customer_${customerIdStr}`).emit("quote_updated", { quote, change });

  // 👨‍💼 Notify all admins
  io.to("admin").emit("quote_updated", { quote, change });

  console.log("Emitting:", {
    customerRoom: `customer_${customerIdStr}`,
    adminRoom: "admin",
    change
  });
};

// ---------- Create quote (Customer) ----------
router.post('/quotes', async (req, res) => {
  try {
    const { customerId, brandName, moleculeName, customMolecule, quantity, unit } = req.body;

    // Count quotes that are NOT Paid or Rejected
    const activeCount = await Quote.countDocuments({
      customerId,
      status: { $nin: ['Paid', 'Rejected'] } // only active quotes
    });

    if (activeCount >= 5) {
      return res.status(400).json({ message: "You can submit a maximum of 5 active quotes." });
    }

    const quote = new Quote({ customerId, brandName, moleculeName, customMolecule, quantity, unit });
    await quote.save();

    const populatedQuote = await quote.populate('customerId', 'name');
    emitQuoteUpdate(populatedQuote);
    res.json(populatedQuote);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already submitted a quote for this brand name." });
    }
    res.status(500).json({ message: err.message });
  }
});




// ---------- Approve quote (Admin) ----------
// ---------- Approve / Send Quote (Admin) ----------
router.patch('/quotes/:id/approve', auth, authorize(["manage_quotes"]), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('customerId', 'name');
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    // ✅ Allow re-send even if already sent
    if (!['Pending', 'Quote Sent'].includes(quote.status)) {
      return res.status(400).json({ message: "Cannot approve in current status" });
    }

    quote.status = 'Quote Sent';
    quote.estimatedRate = req.body.estimatedRate || quote.estimatedRate;
    quote.quantity = req.body.quantity || quote.quantity;      // optional
    quote.unit = req.body.unit || quote.unit;                  // optional
    quote.brandName = req.body.brandName || quote.brandName;   // optional
    quote.moleculeName = req.body.moleculeName || quote.moleculeName;
    quote.customMolecule = req.body.customMolecule || quote.customMolecule;

    await quote.save();

    const populatedQuote = await quote.populate('customerId', 'name');
    emitQuoteUpdate(populatedQuote, { message: "Admin updated and sent quote" });

    res.json(populatedQuote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Customer approves quote ----------
router.patch('/quotes/:id/approve-customer', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('customerId', 'name');
    if (!quote) return res.status(404).json({ message: "Quote not found" });
    if (quote.status !== 'Quote Sent') return res.status(400).json({ message: "Cannot approve in current status" });

    quote.status = 'Approved Quote';
    await quote.save();

    const populatedQuote = await quote.populate('customerId', 'name');
    emitQuoteUpdate(populatedQuote);
    res.json(populatedQuote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Request Payment (Admin) ----------
// ---------- Request Payment (Admin) ----------
router.patch('/quotes/:id/payment', auth, authorize(["manage_quotes"]), async (req, res) => {
  try {
    const { amount, percentage } = req.body;
    const quote = await Quote.findById(req.params.id).populate('customerId', 'name');

    if (!quote) return res.status(404).json({ message: "Quote not found" });
    if (quote.status !== 'Approved Quote')
      return res.status(400).json({ message: "Payment can only be requested after approval" });

    quote.status = 'Payment Requested';
    quote.requestedAmount = amount || quote.estimatedRate;

    // ✅ Dynamically calculate percentage if not provided
    if (percentage) {
      quote.requestedPercentage = percentage;
    } else {
      quote.requestedPercentage = Math.round((quote.requestedAmount / quote.estimatedRate) * 100);
    }

    await quote.save();

    const populatedQuote = await quote.populate('customerId', 'name');
    emitQuoteUpdate(populatedQuote, {
      message: `Admin requested ${quote.requestedPercentage}% advance payment (₹${quote.requestedAmount})`,
    });

    res.json(populatedQuote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ---------- Submit Customer Payment ----------
router.patch(
  "/quotes/:id/customer-payment",
  auth, // 🔒 auth middleware required
  async (req, res) => {
    try {
      const quote = await Quote.findById(req.params.id).populate(
        "customerId",
        "name"
      );
      if (!quote)
        return res.status(404).json({ message: "Quote not found" });

      if (quote.status !== "Payment Requested")
        return res
          .status(400)
          .json({ message: "Payment can only be submitted after request" });

      // Save customer payment info
      quote.customerPaymentInfo = {
        method: req.body?.method || "UPI",
        transactionId: req.body?.transactionId || "Unknown",
        screenshotUrl: req.body?.screenshotUrl || null,
        submittedAt: new Date(),
      };

      await quote.save();

      const populatedQuote = await quote.populate("customerId", "name");

      // Emit update to socket or notifications
      emitQuoteUpdate(populatedQuote);

      res.json(populatedQuote);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ---------- Mark Paid (Admin) ----------
router.patch('/quotes/:id/paid',auth, authorize(["manage_quotes"]), async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status: 'Paid' },
      { new: true }
    ).populate('customerId', 'name');

    emitQuoteUpdate(quote);
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Reject Quote (Admin) ----------
router.patch('/quotes/:id/reject',auth, authorize(["manage_quotes"]), async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    ).populate('customerId', 'name');

    emitQuoteUpdate(quote);
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Update Tracking Step ----------
// ---------- Update Tracking Step ----------
router.patch('/quotes/:id/step', auth, authorize(["manage_quotes"]), async (req, res) => {
  try {
    const { trackingStep } = req.body;
    const quote = await Quote.findById(req.params.id).populate('customerId', 'name');
    if (!quote) return res.status(404).json({ message: "Quote not found" });
    if (trackingStep < 0 || trackingStep >= quote.trackingSteps.length)
      return res.status(400).json({ message: "Invalid tracking step" });

    const prevStep = quote.trackingStep;

    // store user for schema hook
    quote._updatedBy = req.user._id;

    quote.trackingStep = trackingStep;
    await quote.save();

    emitQuoteUpdate(quote, {
      type: "tracking",
      previousStep: prevStep,
      currentStep: trackingStep,
      stepLabel: quote.trackingSteps[trackingStep],
      message: `Quote moved to step: ${quote.trackingSteps[trackingStep]}`
    });

    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Update Full Tracking Steps ----------
router.patch('/quotes/:id/steps', async (req, res) => {
  try {
    const { trackingSteps } = req.body;
    if (!Array.isArray(trackingSteps) || trackingSteps.length === 0)
      return res.status(400).json({ message: "Invalid tracking steps" });

    const quote = await Quote.findById(req.params.id).populate('customerId', 'name');
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    quote.trackingSteps = trackingSteps;
    if (quote.trackingStep >= trackingSteps.length) quote.trackingStep = trackingSteps.length - 1;
    await quote.save();

    emitQuoteUpdate(quote);
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Get Customer Quotes ----------
// ---------- Get Customer Quotes ----------
router.get('/quotes/customer/:customerId', async (req, res) => {
  try {
    console.log("Fetching quotes for customer:", req.params.customerId);
    const quotes = await Quote.find({ customerId: req.params.customerId })
      .populate('customerId', 'name');
    console.log("Found:", quotes.length);
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/quotes", auth, async (req, res, next) => {
  if (req.user.role !== "customer") {
    return authorize(["view_quotes"])(req, res, next);
  }
  next();
}, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "customer") query.customerId = req.user._id;

    const quotes = await Quote.find(query).populate("customerId", "name");
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;
