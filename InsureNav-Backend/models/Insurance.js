const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['auto', 'health', 'property', 'life', 'travel', 'business']
  },
  coverageAmount: { type: Number, required: true, min: 0 },
  premium: { type: Number, required: true, min: 0 },
  deductible: { type: Number, required: true, min: 0 },
  term: { 
    type: String, 
    required: true, 
    enum: ['monthly', 'quarterly', 'semi-annually', 'annually']
  },
  features: [String],
  eligibilityCriteria: [String],
  documents: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

insuranceSchema.index({ name: 1 }, { unique: true });
insuranceSchema.index({ type: 1 });
insuranceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Insurance', insuranceSchema);