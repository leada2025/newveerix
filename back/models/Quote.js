const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  method: { type: String, default: "UPI" },
  transactionId: String,
  amount: Number,
  date: { type: Date, default: Date.now },
  note: String,
});

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
    "Payment Requested",      // Advance requested
    "Advance Paid",           // Customer paid advance
    "Final Payment Requested",
    "Final Payment Submitted", // Admin requested balance
    "Paid",                   // Fully paid
    "Rejected",
  ],
  default: "Pending",
},


    estimatedRate: Number,
    requestedAmount: Number,       // advance requested
    requestedPercentage: Number,   // advance percent

    // new fields
    advancePaid: { type: Boolean, default: false }, // true once customer paid advance
    finalAmount: Number,          // full amount requested at final stage (remaining or full)
    balanceAmount: Number,        // finalAmount - (advance paid)
    payments: { type: [PaymentSchema], default: [] },

    // tracking
    trackingStep: { type: Number, default: 0 },
    trackingSteps: {
      type: [String],
      default: [
        "Brand Name Submitted",
        "Advance Confirmed",
        "Packing Design",
        "Raw Material",
        "Under Production",
        "Under Packing",
        "Under Testing",
        "Final Amount Confirmed",
        "Dispatched",
        "In Transit",
        "Received at Distribution Centre",
        "Delivered to Client",
      ],
    },

    trackingHistory: [
      {
        stepIndex: Number,
        stepName: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

QuoteSchema.index({ customerId: 1, brandName: 1 }, { unique: true });

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
