# InsureNav

Insurance Product Recommender System with Insurance Claim Prediction.

## Running the application

```bash
python app.py
```

## API Endpoints

### API Endpoints

- **POST /recommend**
  - Description: Get product recommendations based on the specified type.
  - Request Body:
    ```json
    {
        "type": "Popularity" | "Content" | "Collaborative",
        "insurance_type": "string" (for popularity-based recommendations),
        "min_clients": "integer" (for popularity-based recommendations),
        "num_recommendations": "integer",
        "product": "string" (for content-based recommendations),
        "client_id": "string" (for collaborative-based recommendations),
        "sim_clients": "integer" (for collaborative-based recommendations)
    }
    ```
  - Response:
    - On success: A JSON array of recommended products.
    - On error: A JSON object with an error message.

- **POST /predict**
  - Description: Predict loan amount and interest rate based on applicant data.
  - Request Body:
    ```json
    {
        "person_home_ownership": "string",
        "loan_intent": "string",
        "loan_grade": "string",
        // other applicant data fields
    }
    ```
  - Response:
    - On success: A JSON object with predicted loan amount and interest rate.
    - On error: A JSON object with an error message.
