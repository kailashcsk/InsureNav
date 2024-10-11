const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./db');

// Import all models
const User = require('./models/User');
const InsurancePolicy = require('./models/InsurancePolicy');
const Claim = require('./models/Claim');
const Admin = require('./models/Admin');
const Payment = require('./models/Payment');
const Purchase = require('./models/Purchase');
const Insurance = require('./models/Insurance');

// Import routes
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const insuranceRoutes = require('./routes/insurances');
const insurancePolicyRoutes = require('./routes/insurancePolicies');
const claimRoutes = require('./routes/claims');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/insurances', insuranceRoutes);
app.use('/api/insurance-policies', insurancePolicyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/payments', paymentRoutes);

mongoose.connection.once('open', async () => {
  console.log('Connected to MongoDB');
  try {
    await Promise.all([
      User.ensureIndexes(),
      InsurancePolicy.ensureIndexes(),
      Claim.ensureIndexes(),
      Admin.ensureIndexes(),
      Payment.ensureIndexes(),
      Purchase.ensureIndexes(),
      Insurance.ensureIndexes()
    ]);
    console.log('All indexes have been created or updated');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));