const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');

// Customer: create quote request
// Customer: create quote request
router.post('/quotes', async (req, res) => {
  const { customerId, brandName, moleculeName, customMolecule, quantity, unit } = req.body;

  const quote = new Quote({
    customerId,
    brandName,          // ✅ Save brand name
    moleculeName,
    customMolecule,
    quantity,
    unit
  });

  await quote.save();
  res.json(quote);
});

// Admin approves quote → Quote Sent
// Admin approves quote → Quote Sent
// Admin approves → sends Quote to customer
// Admin approves
router.patch('/quotes/:id/approve', async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).json({ message: "Quote not found" });

  if (quote.status !== 'Pending') {
    return res.status(400).json({ message: "Quote cannot be approved in its current status" });
  }

  quote.status = 'Quote Sent';
  quote.estimatedRate = req.body.estimatedRate || quote.estimatedRate;
  await quote.save();
  res.json(quote);
});


// Customer approves → moves to Approved Quote
// Customer approves
router.patch('/quotes/:id/approve-customer', async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).json({ message: "Quote not found" });

  if (quote.status !== 'Quote Sent') {
    return res.status(400).json({ message: "Quote cannot be approved in its current status" });
  }

  quote.status = 'Approved Quote';
  await quote.save();
  res.json(quote);
});

// Admin: request payment
// Admin: request payment
router.patch('/quotes/:id/payment', async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).json({ message: "Quote not found" });

  if (quote.status !== "Approved Quote") {
    return res.status(400).json({ message: "Payment can only be requested after customer approves the quote" });
  }

  quote.status = 'Payment Requested';
  quote.requestedAmount = req.body.amount;
  await quote.save();
  res.json(quote);
});
// Customer: submit payment proof/details
router.patch('/quotes/:id/customer-payment', async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).json({ message: "Quote not found" });

  if (quote.status !== "Payment Requested") {
    return res.status(400).json({ message: "Payment can only be submitted after request" });
  }

  quote.customerPaymentInfo = {
    method: req.body.method || "UPI",
    transactionId: req.body.transactionId,
    screenshotUrl: req.body.screenshotUrl || null,
    submittedAt: new Date()
  };

  await quote.save();
  res.json(quote);
});


// Admin: mark as paid
router.patch('/quotes/:id/paid', async (req, res) => {
  const quote = await Quote.findByIdAndUpdate(
    req.params.id,
    { status: 'Paid' },
    { new: true }
  );
  res.json(quote);
});

// Admin: reject quote
router.patch('/quotes/:id/reject', async (req, res) => {
  const quote = await Quote.findByIdAndUpdate(
    req.params.id,
    { status: 'Rejected' },
    { new: true }
  );
  res.json(quote);
});

// Get customer quotes
router.get('/quotes/customer/:customerId', async (req, res) => {
  const quotes = await Quote.find({ customerId: req.params.customerId });
  res.json(quotes);
});

// ---------- Update Tracking Step ----------
// Update current step
router.patch('/quotes/:id/step', async (req, res) => {
  const { trackingStep } = req.body;
  if (trackingStep === undefined || trackingStep < 0) 
    return res.status(400).json({ message: "Invalid trackingStep" });

  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    if (trackingStep >= quote.trackingSteps.length)
      return res.status(400).json({ message: "trackingStep exceeds steps" });

    quote.trackingStep = trackingStep;
    await quote.save();
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update tracking step" });
  }
});

// Update full steps list
router.patch('/quotes/:id/steps', async (req, res) => {
  const { trackingSteps } = req.body;
  if (!Array.isArray(trackingSteps) || trackingSteps.length === 0)
    return res.status(400).json({ message: "Invalid trackingSteps array" });

  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    quote.trackingSteps = trackingSteps;

    // Adjust current step if out of bounds
    if (quote.trackingStep >= trackingSteps.length) {
      quote.trackingStep = trackingSteps.length - 1;
    }

    await quote.save();
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update tracking steps" });
  }
});


// Get all quotes (admin)
router.get('/quotes', async (req, res) => {
  const quotes = await Quote.find().populate('customerId');
  res.json(quotes);
});

module.exports = router;
