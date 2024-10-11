const express = require('express');
const router = express.Router();
const Insurance = require('../models/Insurance');
const { body, validationResult } = require('express-validator');

// Get all insurances with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const insurances = await Insurance.find().skip(skip).limit(limit);
    const total = await Insurance.countDocuments();

    res.json({
      insurances,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalInsurances: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching insurances', error: error.message });
  }
});

// Get a specific insurance
router.get('/:id', async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);
    if (!insurance) return res.status(404).json({ message: 'Insurance not found' });
    res.json(insurance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching insurance', error: error.message });
  }
});

// Create a new insurance with validation
router.post('/', [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('type').isIn(['auto', 'health', 'property', 'life', 'travel', 'business']).withMessage('Invalid insurance type'),
  body('coverageAmount').isFloat({ min: 0 }).withMessage('Coverage amount must be a positive number'),
  body('premium').isFloat({ min: 0 }).withMessage('Premium must be a positive number'),
  body('deductible').isFloat({ min: 0 }).withMessage('Deductible must be a positive number'),
  body('term').isIn(['monthly', 'quarterly', 'semi-annually', 'annually']).withMessage('Invalid term')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const insurance = new Insurance(req.body);

  try {
    const newInsurance = await insurance.save();
    res.status(201).json(newInsurance);
  } catch (error) {
    res.status(400).json({ message: 'Error creating insurance', error: error.message });
  }
});

// Update an insurance
router.patch('/:id', [
  body('name').optional().isString().notEmpty().withMessage('Name is required'),
  body('description').optional().isString().notEmpty().withMessage('Description is required'),
  body('type').optional().isIn(['auto', 'health', 'property', 'life', 'travel', 'business']).withMessage('Invalid insurance type'),
  body('coverageAmount').optional().isFloat({ min: 0 }).withMessage('Coverage amount must be a positive number'),
  body('premium').optional().isFloat({ min: 0 }).withMessage('Premium must be a positive number'),
  body('deductible').optional().isFloat({ min: 0 }).withMessage('Deductible must be a positive number'),
  body('term').optional().isIn(['monthly', 'quarterly', 'semi-annually', 'annually']).withMessage('Invalid term')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const insurance = await Insurance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!insurance) return res.status(404).json({ message: 'Insurance not found' });
    res.json(insurance);
  } catch (error) {
    res.status(400).json({ message: 'Error updating insurance', error: error.message });
  }
});

// Delete an insurance
router.delete('/:id', async (req, res) => {
  try {
    const insurance = await Insurance.findByIdAndDelete(req.params.id);
    if (!insurance) return res.status(404).json({ message: 'Insurance not found' });
    res.json({ message: 'Insurance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting insurance', error: error.message });
  }
});

module.exports = router;