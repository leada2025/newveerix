// routes/quoteRoutes.js
const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const socket = require("../socket");  // socket.io instance
const auth = require("../middleware/auth");
// ---------- Helper: Emit update ----------
const emitQuoteUpdate = (quote, change = {}) => {
  if (!quote?.customerId) return;
  const io = socket.getIO();

  const customerIdStr = quote.customerId._id ? quote.customerId._id.toString() : quote.customerId.toString();

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
    const quote = new Quote({ customerId, brandName, moleculeName, customMolecule, quantity, unit });
    await quote.save();
    const populatedQuote = await quote.populate('customerId', 'name');
    emitQuoteUpdate(populatedQuote);
    res.json(populatedQuote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Approve quote (Admin) ----------
router.patch('/quotes/:id/approve', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('customerId', 'name');
    if (!quote) return res.status(404).json({ message: "Quote not found" });
    if (quote.status !== 'Pending') return res.status(400).json({ message: "Cannot approve in current status" });

    quote.status = 'Quote Sent';
    quote.estimatedRate = req.body.estimatedRate || quote.estimatedRate;
    await quote.save();

    const populatedQuote = await quote.populate('customerId', 'name');
    emitQuoteUpdate(populatedQuote);
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
router.patch('/quotes/:id/payment', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('customerId', 'name');
    if (!quote) return res.status(404).json({ message: "Quote not found" });
    if (quote.status !== 'Approved Quote') return res.status(400).json({ message: "Payment can only be requested after approval" });

    quote.status = 'Payment Requested';
    quote.requestedAmount = req.body.amount || quote.estimatedRate;
    await quote.save();

    const populatedQuote = await quote.populate('customerId', 'name');
    emitQuoteUpdate(populatedQuote);
    res.json(populatedQuote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Submit Customer Payment ----------
router.patch('/quotes/:id/customer-payment', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('customerId', 'name');
    if (!quote) return res.status(404).json({ message: "Quote not found" });
    if (quote.status !== 'Payment Requested') return res.status(400).json({ message: "Payment can only be submitted after request" });

    quote.customerPaymentInfo = {
      method: req.body.method || "UPI",
      transactionId: req.body.transactionId,
      screenshotUrl: req.body.screenshotUrl || null,
      submittedAt: new Date()
    };
    await quote.save();

    const populatedQuote = await quote.populate('customerId', 'name');
    emitQuoteUpdate(populatedQuote);
    res.json(populatedQuote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Mark Paid (Admin) ----------
router.patch('/quotes/:id/paid', async (req, res) => {
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
router.patch('/quotes/:id/reject', async (req, res) => {
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
router.patch('/quotes/:id/step', auth, async (req, res) => {
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



router.get("/quotes", auth, async (req, res) => {
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
