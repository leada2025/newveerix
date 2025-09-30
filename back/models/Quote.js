const mongoose = require("mongoose");

const QuoteSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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

    // 🟢 New: Track history of step changes
    trackingHistory: [
      {
        stepIndex: Number,              // e.g. 2
        stepName: String,               // e.g. "Packing Design"
        changedAt: { type: Date, default: Date.now }, // timestamp
      },
    ],
  },
  { timestamps: true }
);

// 🔹 Whenever trackingStep is updated, push to trackingHistory
QuoteSchema.pre("save", function (next) {
  if (this.isModified("trackingStep")) {
    this.trackingHistory.push({
      stepIndex: this.trackingStep,
      stepName: this.trackingSteps[this.trackingStep],
      changedAt: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model("Quote", QuoteSchema);
