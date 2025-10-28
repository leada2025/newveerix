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

    // brand info
     brandName: { 
      type: String, 
      default: "", // Change from null to empty string
      trim: true 
    },
    addBrandLater: { type: Boolean, default: false }, // ✅ new field

    moleculeName: String,
    customMolecule: String,
    quantity: Number,
    unit: String,

    // ✅ NEW charge-related checkboxes
    documentUrl: String,       // 🔥 add this
  documentName: String, 
   invoiceUrl: String,
  invoiceName: String, 
    cartonBoxCharges: { type: Boolean, default: false },
    artworkCharges: { type: Boolean, default: false },
    labelCharges: { type: Boolean, default: false },
    cylinderCharges: { type: Boolean, default: false },

    status: {
      type: String,
      enum: [
        "Pending",
        "Quote Sent",
        "Approved Quote",
        "Payment Requested",
        "Advance Paid",
        "Final Payment Requested",
        "Final Payment Submitted",
        "Paid",
        "Rejected",
      ],
      default: "Pending",
    },

    estimatedRate: Number,
    requestedAmount: Number,
    requestedPercentage: Number,

    advancePaid: { type: Boolean, default: false },
    finalAmount: Number,
    balanceAmount: Number,
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
