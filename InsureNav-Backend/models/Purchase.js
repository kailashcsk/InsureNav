const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  insurance: { type: mongoose.Schema.Types.ObjectId, ref: 'Insurance', required: true },
  orderNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true, min: 0 },
  paymentDetails: {
    cardNumber: { type: String, required: true },
    expirationDate: { type: String, required: true },
    cvv: { type: String, required: true }
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  purchaseDate: { type: Date, default: Date.now },
});

purchaseSchema.index({ orderNumber: 1 }, { unique: true });
purchaseSchema.index({ user: 1, insurance: 1 });

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;