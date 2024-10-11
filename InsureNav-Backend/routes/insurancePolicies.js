const express = require('express');
const router = express.Router();
const InsurancePolicy = require('../models/InsurancePolicy');
const { body, validationResult } = require('express-validator');

// Get all policies with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const policies = await InsurancePolicy.find()
      .populate('insuranceType user', '-password')
      .skip(skip)
      .limit(limit);

    const total = await InsurancePolicy.countDocuments();

    res.json({
      policies,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPolicies: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policies', error: error.message });
  }
});

// Create a new policy with validation
router.post('/', [
  body('policyNumber').isString().notEmpty().withMessage('Policy number is required'),
  body('insuranceType').isMongoId().withMessage('Valid insurance type ID is required'),
  body('user').isMongoId().withMessage('Valid user ID is required'),
  body('startDate').isISO8601().toDate().withMessage('Valid start date is required'),
  body('endDate').isISO8601().toDate().withMessage('Valid end date is required'),
  body('premium').isFloat({ min: 0 }).withMessage('Premium must be a positive number'),
  body('coverageAmount').isFloat({ min: 0 }).withMessage('Coverage amount must be a positive number'),
  body('paymentFrequency').isIn(['monthly', 'quarterly', 'semi-annually', 'annually']).withMessage('Invalid payment frequency')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const policy = new InsurancePolicy(req.body);

  try {
    const newPolicy = await policy.save();
    res.status(201).json(newPolicy);
  } catch (error) {
    res.status(400).json({ message: 'Error creating policy', error: error.message });
  }
});

// Get policy by ID
router.get('/:id', async (req, res) => {
  try {
    const policy = await InsurancePolicy.findById(req.params.id).populate('insuranceType user', '-password');
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy', error: error.message });
  }
});

// Update policy
router.put('/:id', [
  body('premium').optional().isFloat({ min: 0 }).withMessage('Premium must be a positive number'),
  body('coverageAmount').optional().isFloat({ min: 0 }).withMessage('Coverage amount must be a positive number'),
  body('paymentFrequency').optional().isIn(['monthly', 'quarterly', 'semi-annually', 'annually']).withMessage('Invalid payment frequency')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const policy = await InsurancePolicy.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: 'Error updating policy', error: error.message });
  }
});

module.exports = router;