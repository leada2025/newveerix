const mongoose = require("mongoose");

const QuoteSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    brandName: String,
    moleculeName: String,
    customMolecule: String,
    quantity: Number,
    unit: String,

    status: {
      type: String,
      enum: [
        "Pending",
        "Quote Sent",
        "Approved Quote",
        "Payment Requested",
        "Paid",
        "Rejected",
      ],
      default: "Pending",
    },

    estimatedRate: Number,
    requestedAmount: Number,

    // 🟢 Tracking progress
    trackingStep: { type: Number, default: 0 },
    trackingSteps: {
      type: [String],
      default: [
        "Brand Name Submitted",
        "Payment Confirmed",
        "Packing Design",
        "Raw Material",
        "Under Production",
        "Under Packing",
        "Under Testing",
        "Dispatched",
        "In Transit",
        "Received at Distribution Centre",
        "Delivered to Client",
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", QuoteSchema);
