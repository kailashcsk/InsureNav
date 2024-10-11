const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const { body, validationResult } = require('express-validator');

// Get all claims with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const claims = await Claim.find(query)
      .populate('policy user adjuster', '-password')
      .skip(skip)
      .limit(limit);

    const total = await Claim.countDocuments(query);

    res.json({
      claims,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalClaims: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claims', error: error.message });
  }
});

// Create a new claim with validation
router.post('/', [
  body('claimNumber').isString().notEmpty().withMessage('Claim number is required'),
  body('policy').isMongoId().withMessage('Valid policy ID is required'),
  body('user').isMongoId().withMessage('Valid user ID is required'),
  body('dateOfIncident').isISO8601().toDate().withMessage('Valid date of incident is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('claimAmount').isFloat({ min: 0 }).withMessage('Claim amount must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const claim = new Claim(req.body);

  try {
    const newClaim = await claim.save();
    res.status(201).json(newClaim);
  } catch (error) {
    res.status(400).json({ message: 'Error creating claim', error: error.message });
  }
});

// Get claim by ID
router.get('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('policy user adjuster', '-password');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claim', error: error.message });
  }
});

// Update claim status
router.patch('/:id/status', [
  body('status').isIn(['submitted', 'under review', 'approved', 'denied', 'closed']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    res.status(400).json({ message: 'Error updating claim status', error: error.message });
  }
});

module.exports = router;