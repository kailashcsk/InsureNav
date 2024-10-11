const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimNumber: { type: String, required: true, unique: true },
  policy: { type: mongoose.Schema.Types.ObjectId, ref: 'InsurancePolicy', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateOfIncident: { type: Date, required: true },
  dateReported: { type: Date, default: Date.now },
  description: { type: String, required: true },
  status: { type: String, enum: ['submitted', 'under review', 'approved', 'denied', 'closed'], default: 'submitted' },
  claimAmount: Number,
  approvedAmount: Number,
  documents: [{ name: String, url: String }],
  adjuster: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


claimSchema.index({ claimNumber: 1 }, { unique: true });
claimSchema.index({ policy: 1 });
claimSchema.index({ user: 1 });

const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim;