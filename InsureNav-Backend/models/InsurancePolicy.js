const mongoose = require('mongoose');

const insurancePolicySchema = new mongoose.Schema({
  policyNumber: { type: String, required: true, unique: true },
  insuranceType: { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceType', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  premium: { type: Number, required: true },
  coverageAmount: { type: Number, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  paymentFrequency: { type: String, enum: ['monthly', 'quarterly', 'semi-annually', 'annually'] },
  additionalCoverages: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


insurancePolicySchema.index({ policyNumber: 1 }, { unique: true });
insurancePolicySchema.index({ user: 1 });
insurancePolicySchema.index({ insuranceType: 1 });

const InsurancePolicy = mongoose.model('InsurancePolicy', insurancePolicySchema);

module.exports = InsurancePolicy;