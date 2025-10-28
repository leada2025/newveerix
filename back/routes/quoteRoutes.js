// routes/quoteRoutes.js
const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const socket = require("../socket");  // socket.io instance
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const Notification = require("../models/Notification");
// ---------- Helper: Emit update ----------
const { upload } = require("../utils/cloudinary");

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
// ---------- Create quote (Customer) ----------
router.post('/quotes', async (req, res) => {
  try {
    const {
      customerId,
      brandName,
      moleculeName,
      customMolecule,
      quantity,
      unit,
      addBrandLater,
    cartonBoxCharges,
      artworkCharges,
      labelCharges,
      cylinderCharges
    } = req.body;

    // ✅ Validate brand name rule
    if (!addBrandLater && (!brandName || brandName.trim() === "")) {
      return res.status(400).json({ message: "Brand name is required unless 'Add Brand Later' is checked." });
    }

    // ✅ Limit active quotes
    const activeCount = await Quote.countDocuments({
      customerId,
      status: { $nin: ["Paid", "Rejected"] },
    });

    if (activeCount >= 5) {
      return res.status(400).json({ message: "You can submit a maximum of 5 active quotes." });
    }

    const quote = new Quote({
      customerId,
   brandName: addBrandLater ? `__temp_${Date.now()}_${Math.floor(Math.random() * 1000)}` : brandName,

      addBrandLater,
      moleculeName,
      customMolecule,
      quantity,
      unit,
   cartonBoxCharges,
      artworkCharges,
      labelCharges,
      cylinderCharges
    });

    await quote.save();
    const populatedQuote = await quote.populate("customerId", "name");
    emitQuoteUpdate(populatedQuote);
    res.json(populatedQuote);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});




// ---------- Approve quote (Admin) ----------
// ---------- Approve / Send Quote (Admin) ----------
// Approve / Send Quote (Admin) - allow editing unless finalized
router.patch(
  "/quotes/:id/approve",
  auth,
  authorize(["manage_quotes"]),
  upload.single("document"),
  async (req, res) => {
    try {
      const quote = await Quote.findById(req.params.id).populate("customerId", "name");
      if (!quote) return res.status(404).json({ message: "Quote not found" });

      if (["Paid", "Rejected"].includes(quote.status)) {
        return res.status(400).json({ message: "Cannot modify a finalized quote" });
      }

      quote.status = "Quote Sent";
      quote.estimatedRate = req.body.estimatedRate ?? quote.estimatedRate;
      quote.quantity = req.body.quantity ?? quote.quantity;
      quote.unit = req.body.unit ?? quote.unit;
      quote.brandName = req.body.brandName ?? quote.brandName;
      quote.moleculeName = req.body.moleculeName ?? quote.moleculeName;
      quote.customMolecule = req.body.customMolecule ?? quote.customMolecule;

      if (req.file && req.file.path) {
        quote.documentUrl = req.file.path;
        quote.documentName = req.file.originalname;
      }

      await quote.save();

      const populatedQuote = await quote.populate("customerId", "name");

      // ✅ Emit socket event safely
      const io = socket.getIO();
      io.emit("quote_updated", { quote: populatedQuote, message: "Admin updated and sent quote" });

      res.json(populatedQuote);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

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


// ---------- Admin Marks Advance Paid ----------
router.patch('/quotes/:id/advance-paid', auth, authorize(["manage_quotes"]), async (req, res) => {
  try {
    const { amount, method, transactionId } = req.body;
    const quote = await Quote.findById(req.params.id).populate("customerId", "name");
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    if (quote.status !== 'Payment Requested')
      return res.status(400).json({ message: "Advance payment not requested yet." });

    const paidAmount = amount ?? quote.requestedAmount ?? 0;

    quote.payments.push({
      method: method || "UPI",
      transactionId: transactionId || `TXN_ADV_${Date.now()}`,
      amount: paidAmount,
      note: "Advance payment (Admin)",
    });

    quote.advancePaid = true;
    quote.status = "Advance Paid";
    quote.balanceAmount = (quote.finalAmount ?? quote.estimatedRate) - paidAmount;
    quote.trackingStep = Math.max(quote.trackingStep, 3);

    await quote.save();
    const populatedQuote = await quote.populate("customerId", "name");
    emitQuoteUpdate(populatedQuote, { message: `Admin marked advance paid: ₹${paidAmount}` });
    res.json(populatedQuote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ---------- Customer Pays Advance ----------
router.patch("/quotes/:id/customer-advance-payment", auth, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate("customerId", "name");
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    if (quote.status !== "Payment Requested")
      return res.status(400).json({ message: "Advance not yet requested." });

    const amountPaid = req.body.amount ?? quote.requestedAmount ?? 0;

    // Record payment attempt
    quote.payments.push({
      method: req.body.method || "UPI",
      transactionId: req.body.transactionId || `TXN_ADV_${Date.now()}`,
      amount: amountPaid,
      note: "Advance payment submitted (pending admin confirmation)",
      confirmed: false, // ✅ flag to track admin confirmation
    });

    // Do NOT mark advancePaid yet
    // quote.advancePaid = true;
    // quote.status = "Advance Paid";

    await quote.save();

    const populatedQuote = await quote.populate("customerId", "name");
    emitQuoteUpdate(populatedQuote, { message: `Advance payment submitted (pending confirmation)` });
    res.json(populatedQuote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
router.patch("/quotes/:id/admin-confirm-advance", auth, authorize(["manage_quotes"]), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate("customerId", "name");
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    if (quote.status !== "Payment Requested")
      return res.status(400).json({ message: "Advance payment not requested yet." });

    // Find last submitted payment and confirm
    const lastPayment = quote.payments[quote.payments.length - 1];
    if (!lastPayment) return res.status(400).json({ message: "No payment submitted by customer." });

    lastPayment.confirmed = true;

    // Update quote status
    quote.advancePaid = true;
    quote.status = "Advance Paid";
 

    quote.balanceAmount = (quote.finalAmount ?? quote.estimatedRate) - lastPayment.amount;

    await quote.save();
    const populatedQuote = await quote.populate("customerId", "name");
    emitQuoteUpdate(populatedQuote, { message: `Advance payment confirmed by admin: ₹${lastPayment.amount}` });

    res.json(populatedQuote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
// PATCH /api/quotes/:id/customer-final-payment
router.patch("/quotes/:id/customer-final-payment", async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate("customerId", "name");
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    const { amount, method, transactionId } = req.body;

    quote.payments = quote.payments || [];
    quote.payments.push({
      amount: amount ?? 0,
      method: method || "UPI",
      transactionId: transactionId || `TXN_FINAL_${Date.now()}`,
      date: new Date()
    });

    quote.status = "Final Payment Submitted";
    await quote.save();

    // Emit update
    const io = socket.getIO();
    io.to(`customer_${quote.customerId._id}`).emit("quote_updated", { quote });
    io.to("admin").emit("quote_updated", { quote });

    res.json(quote);
  } catch (err) {
    console.error("Customer final payment error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ---------- Admin Requests Final Payment ----------
// ---------- Admin Requests Final Payment ----------
router.patch("/quotes/:id/request-final-payment", 
  auth, 
  authorize(["manage_quotes"]), 
  upload.fields([{ name: 'invoice', maxCount: 1 }]), // Add this line
  async (req, res) => {
  try {
    const { finalAmount } = req.body;
    const quote = await Quote.findById(req.params.id).populate("customerId", "name");
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    if (!quote.advancePaid)
      return res.status(400).json({ message: "Advance must be paid before requesting final payment." });

    // Use the manually entered finalAmount directly without any calculations
    const manualFinalAmount = Number(finalAmount) || 0;

    // Set the values directly without any validations or calculations
    quote.finalAmount = manualFinalAmount;
    quote.balanceAmount = manualFinalAmount; // Set balance to the manual amount
    quote.status = "Final Payment Requested";

    // Handle invoice file upload if provided
    if (req.files && req.files.invoice) {
      const invoiceFile = req.files.invoice[0];
      quote.invoiceUrl = invoiceFile.path;
      quote.invoiceName = invoiceFile.originalname;
    }

    await quote.save();

    const populatedQuote = await quote.populate("customerId", "name");
    emitQuoteUpdate(populatedQuote, { 
      message: `Final payment requested: ₹${manualFinalAmount}` 
    });
    res.json(populatedQuote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ---------- Mark Paid (Admin) ----------
router.patch('/quotes/:id/finalPaid',auth, authorize(["manage_quotes"]), async (req, res) => {
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
