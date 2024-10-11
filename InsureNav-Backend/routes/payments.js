const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { body, validationResult } = require('express-validator');

// Get all payments with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find()
      .populate('policy user', '-password')
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments();

    res.json({
      payments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayments: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

// Create a new payment with validation
router.post('/', [
  body('policy').isMongoId().withMessage('Valid policy ID is required'),
  body('user').isMongoId().withMessage('Valid user ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').isIn(['credit card', 'debit card', 'bank transfer', 'paypal']).withMessage('Invalid payment method'),
  body('transactionId').optional().isString().withMessage('Transaction ID must be a string')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const payment = new Payment(req.body);

  try {
    const newPayment = await payment.save();
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating payment', error: error.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('policy user', '-password');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
});

// Update payment status
router.patch('/:id/status', [
  body('status').isIn(['pending', 'completed', 'failed']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Error updating payment status', error: error.message });
  }
});

module.exports = router;