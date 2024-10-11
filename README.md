# InsureNav Backend

InsureNav is a virtual customer service application for the insurance domain. This repository contains the backend code for the InsureNav project.

## Project Structure

- `models/`: Mongoose schemas and models
- `routes/`: Express route handlers
- `server.js`: Main application entry point
- `db.js`: Database connection logic

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/insurenav-backend.git
   cd insurenav-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following content:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5001
   ```

4. Start the server:
   ```
   npm run dev
   ```

## Database

We're using MongoDB Atlas for our database. The connection is managed in `db.js`.

### Collections

- users
- insurances
- claims
- payments
- purchases
- insurancetypes

## API Endpoints

- Users: `/api/users`
- Insurances: `/api/insurances`
- Claims: `/api/claims`
- Payments: `/api/payments`
- Purchases: `/api/purchases`

Each endpoint supports standard CRUD operations.

## Models

- User
- Insurance
- Claim
- Payment
- Purchase
- InsuranceType

Each model defines the schema for its respective collection in the database.

## Routes

Route handlers in the `routes/` directory define the API endpoints and their corresponding actions.

