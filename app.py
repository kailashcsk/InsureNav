import numpy as np
import pandas as pd
import scipy.stats as stats
from datetime import datetime
from feature_engine.outliers import Winsorizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
from joblib import load

app = Flask(__name__)

# Define the feature columns based on your preprocessing steps
feature_columns = [
    'person_age', 'person_income', 'person_emp_length', 'loan_int_rate',
       'loan_percent_income', 'cb_person_cred_hist_length',
       'person_home_ownership_OTHER', 'person_home_ownership_OWN',
       'person_home_ownership_RENT', 'loan_intent_EDUCATION',
       'loan_intent_HOMEIMPROVEMENT', 'loan_intent_MEDICAL',
       'loan_intent_PERSONAL', 'loan_intent_VENTURE', 'loan_grade_B',
       'loan_grade_C', 'loan_grade_D', 'loan_grade_E', 'loan_grade_F',
       'loan_grade_G', 'cb_person_default_on_file_Y'
]

# Load the pre-trained models
rf_model_loan = load('./model/random_forest_model.joblib') 

# Load product and client data from CSV files
products = pd.read_csv(r'./data/products.csv')
clients = pd.read_csv(r'./data/clients.csv')

# Unpivot the clients DataFrame to have one row per client-product combination
clients_unpivot = clients.melt(id_vars=['ClientID', 'join_date', 'sex', 'marital_status', 'birth_year', 'branch_code', 'occupation_code', 'occupation_category_code'],
                                value_vars=['P5DA', 'RIBP', '8NN1', '7POT', '66FJ', 'GYSR', 'SOP4', 'RVSZ', 'PYUQ', 'LJR9', 'N2MW', 'AHXO',
                                            'BSTQ', 'FM3X', 'K6QO', 'QBOL', 'JWFN', 'JZ9D', 'J9JW', 'GHYX', 'ECY3'],
                                var_name='ProductCode',
                                value_name='TakenProduct')

# Merge products with clients to create a comprehensive DataFrame
ProductClients = pd.merge(products, clients_unpivot, on='ProductCode').drop(columns='join_date')

# Split the InsuranceType column into separate columns
insurance_columns = ProductClients['InsuranceType'].str.split('|', expand=True)
ProductClients_Ins_1 = pd.concat([ProductClients, insurance_columns], axis=1).drop(columns='InsuranceType')

# Melt the DataFrame to have a long format for insurance types
ProductClients_Ins = ProductClients_Ins_1.melt(id_vars=['ProductCode', 'ProductDescription', 'ClientID', 'sex', 'marital_status', 'birth_year', 'branch_code', 'occupation_code', 'occupation_category_code', 'TakenProduct'],
                                               value_vars=[0, 1, 2],
                                               value_name='InsuranceType').dropna().drop(columns='variable')

# Clean up the InsuranceType column
ProductClients_Ins.InsuranceType = ProductClients_Ins.InsuranceType.str.strip()

# Calculate age from birth year
ProductClients_Ins['birth_year'] = datetime.now().year - ProductClients_Ins['birth_year']
ProductClients_Ins.rename(columns={'birth_year': 'Age'}, inplace=True)

# Cap age outliers using Winsorization
capper = Winsorizer(capping_method='iqr', tail='both', fold=1.5, variables='Age')
ProductClients_Ins_cap = capper.fit_transform(ProductClients_Ins)

# Categorize age into groups
ProductClients_Ins_cap['Age'] = np.where(ProductClients_Ins_cap.Age < 30, 'Young',
                                         np.where(ProductClients_Ins_cap.Age < 50, 'Middle-Aged',
                                                  np.where(ProductClients_Ins_cap.Age < 70, 'Senior', 'Senior Citizen')))

# Drop unnecessary columns
ProductClients_Ins_cap.drop(columns='occupation_code', inplace=True)

# Clean up marital status values
ProductClients_Ins_cap['marital_status'] = np.where(ProductClients_Ins_cap.marital_status.isin(['R', 'P', 'f']), 'Other',
                                                    np.where(ProductClients_Ins_cap.marital_status == 'U', 'S', ProductClients_Ins_cap.marital_status))

# Filter clients who have taken insurance products
clients_with_ins = ProductClients_Ins_cap[ProductClients_Ins_cap['TakenProduct'] > 0]

# Create a summary DataFrame of insurance products and the number of clients
Insurance_Product_summary = pd.DataFrame(clients_with_ins.groupby(['InsuranceType', 'ProductDescription'])['ClientID'].nunique()).rename(columns={'ClientID': 'Num Clients'})
Insurance_Product_summary = Insurance_Product_summary.reset_index()

# Create a TF-IDF matrix for the insurance types
tf = TfidfVectorizer(stop_words='english')
tf_matrix = tf.fit_transform(products['InsuranceType'])

# Calculate cosine similarity between products based on insurance types
product_similarity = cosine_similarity(tf_matrix)
np.fill_diagonal(product_similarity, 0)
product_similarity_df = pd.DataFrame(product_similarity)

def popularity_based_recommendation(InsuranceType, minclients, numrecomm):
    """
    Generate product recommendations based on popularity.
    
    Parameters:
    - InsuranceType: The type of insurance to filter recommendations.
    - minclients: Minimum number of clients for a product to be considered.
    - numrecomm: Number of recommendations to return.
    
    Returns:
    - A list of recommended products.
    """
    Productset_Popularity_1 = Insurance_Product_summary[(Insurance_Product_summary['InsuranceType'] == InsuranceType) & (Insurance_Product_summary['Num Clients'] >= minclients)]
    Productset_Popularity_1['S.No'] = Productset_Popularity_1.sort_values('Num Clients', ascending=False).groupby('InsuranceType').cumcount() + 1
    Productset_Popularity_1.drop(columns='InsuranceType', inplace=True)
    Productset_Popularity_1 = Productset_Popularity_1[['S.No', 'ProductDescription', 'Num Clients']].rename(columns={'ProductDescription': 'Product Description'})
    Productset_Popularity = Productset_Popularity_1[Productset_Popularity_1['S.No'] <= numrecomm].sort_values('S.No')
    
    return Productset_Popularity.to_dict(orient='records')

def content_based_recommendation(product, numrecomm):
    """
    Generate product recommendations based on content similarity.
    
    Parameters:
    - product: The product description to base recommendations on.
    - numrecomm: Number of recommendations to return.
    
    Returns:
    - A list of recommended products.
    """
    index_t = products[products['ProductDescription'] == product].index.tolist()[0]
    products['similarity'] = product_similarity_df.iloc[index_t]
    Productset_Content_1 = products.copy().sort_values('similarity', ascending=False)
    products = products.drop(columns='similarity')
    Productset_Content_1['Sl.No'] = range(1, len(Productset_Content_1) + 1)
    Productset_Content_1 = Productset_Content_1[['Sl.No', 'ProductDescription']].rename(columns={'ProductDescription': 'Product Description'})
    Productset_Content = Productset_Content_1[Productset_Content_1['Sl.No'] <= numrecomm]

    return Productset_Content.to_dict(orient='records')

def collaborative_based_recommendation(clientID, numrecomm, simusers):
    """
    Generate product recommendations based on collaborative filtering.
    
    Parameters:
    - clientID: The ID of the client for whom recommendations are generated.
    - numrecomm: Number of recommendations to return.
    - simusers: Number of similar users to consider.
    
    Returns:
    - A list of recommended products.
    """
    Collab_df = ProductClients[['ClientID', 'ProductCode', 'ProductDescription', 'TakenProduct']]
    client_taken = Collab_df[(Collab_df['ClientID'] == clientID) & (Collab_df['TakenProduct'] > 0)]
    peers = Collab_df[(Collab_df['ProductCode'].isin(client_taken['ProductCode'])) & (Collab_df['TakenProduct'] > 0)]
    peers = peers[peers['ClientID'] != clientID]
    peers_grp = peers.groupby('ClientID')

    pearson_coef = {}
    for name, peer in peers_grp:
        client_peer_taken = client_taken[client_taken['ProductCode'].isin(peer['ProductCode'])]
        client_peer_taken = client_peer_taken.sort_values('ProductCode')
        peer = peer.sort_values('ProductCode')

        client_taken_list = client_peer_taken['TakenProduct'].tolist()
        peer_taken_list = peer['TakenProduct'].tolist()

        if (len(client_taken_list) > 1) & (len(peer_taken_list) > 1):
            pearson_coef[name] = stats.pearsonr(client_taken_list, peer_taken_list).statistic

    pearson_coef_df = pd.DataFrame.from_dict(pearson_coef, orient='index').fillna(0).reset_index().rename(columns={'index': 'ClientID', 0: 'SimilarityCoef'})
    pearson_coef_df = pearson_coef_df.sort_values('SimilarityCoef', ascending=False)[:simusers]

    similar_peers = Collab_df[(Collab_df['ClientID'].isin(pearson_coef_df['ClientID'])) & (Collab_df['TakenProduct'] > 0)]
    similar_peers = similar_peers[~similar_peers['ProductCode'].isin(client_taken['ProductCode'])]
    similar_peers = similar_peers.merge(pearson_coef_df, on='ClientID')
    similar_peers['wt_takenproduct'] = similar_peers['TakenProduct'] * similar_peers['SimilarityCoef']

    peer_recommended_products = pd.DataFrame(similar_peers.groupby(['ProductDescription'])[['wt_takenproduct', 'SimilarityCoef']].sum()).reset_index().rename(columns={'wt_takenproduct': 'WeightedSum', 'SimilarityCoef': 'SumOfWeights'})
    peer_recommended_products['WeightedAvgScore'] = peer_recommended_products['WeightedSum'] / peer_recommended_products['SumOfWeights']
    peer_recommended_products = peer_recommended_products.sort_values('WeightedAvgScore', ascending=False)
    peer_recommended_products['S.No'] = range(1, len(peer_recommended_products) + 1)

    Productset_Collaborative = peer_recommended_products[peer_recommended_products['S.No'] <= numrecomm]
    Productset_Collaborative = Productset_Collaborative[['S.No', 'ProductDescription']].rename(columns={'ProductDescription': 'Product Description'})

    return Productset_Collaborative.to_dict(orient='records')

@app.route('/recommend', methods=['POST'])
def recommend():
    """
    API endpoint to get product recommendations based on the specified type.
    
    Expects a JSON payload with the following fields:
    - type: The type of recommendation ('Popularity', 'Content', 'Collaborative').
    - insurance_type: The type of insurance (for popularity-based recommendations).
    - min_clients: Minimum number of clients (for popularity-based recommendations).
    - num_recommendations: Number of recommendations to return.
    - product: The product description (for content-based recommendations).
    - client_id: The client ID (for collaborative-based recommendations).
    - sim_clients: Number of similar clients to consider (for collaborative-based recommendations).
    
    Returns:
    - A JSON response with the recommended products or an error message.
    """
    data = request.json
    recommendation_type = data.get('type')
    print(recommendation_type)
    if recommendation_type == 'Popularity':
        return jsonify(popularity_based_recommendation(data['insurance_type'], data['min_clients'], data['num_recommendations']))
    elif recommendation_type == 'Content':
        return jsonify(content_based_recommendation(data['product'], data['num_recommendations']))
    elif recommendation_type == 'Collaborative':
        return jsonify(collaborative_based_recommendation(data['client_id'], data['num_recommendations'], data['sim_clients']))
    else:
        return jsonify({'error': 'Invalid recommendation type'}), 400

@app.route('/predict', methods=['POST'])
def predict_loan_and_interest():
    """
    API endpoint to predict loan amount and interest rate based on applicant data.
    
    Expects a JSON payload with the following fields:
    - person_age: Age of the applicant.
    - person_income: Income of the applicant.
    - person_home_ownership: Home ownership status of the applicant (e.g., OWN, RENT).
    - person_emp_length: Length of employment in years.
    - loan_intent: Intent for the loan (e.g., PERSONAL, BUSINESS).
    - loan_grade: Grade of the loan (e.g., A, B, C).
    
    Example of a mock curl request:
    ```
    curl -X POST http://127.0.0.1:5000/predict \
    -H "Content-Type: application/json" \
    -d '{
        "person_age": [30],
        "person_income": [23000],
        "person_home_ownership": ["OWN"],
        "person_emp_length": [5],
        "loan_intent": ["PERSONAL"],
        "loan_grade": ["A"]
    }'
    ```
    """
    # Get JSON data from the request
    applicant_data = request.json

    # Create a DataFrame from the applicant data
    new_df = pd.DataFrame(applicant_data)

    # Encode categorical variables the same way you did for training data
    new_df_encoded = pd.get_dummies(new_df, columns=['person_home_ownership', 'loan_intent', 'loan_grade'], drop_first=True)

    # Align the columns of new_df_encoded with the training data
    new_df_encoded = new_df_encoded.reindex(columns=feature_columns, fill_value=0)

    # Predict the loan amount using the Random Forest model
    predicted_loan_amount = rf_model_loan.predict(new_df_encoded)

    # Return the predictions as a JSON response
    return jsonify({
        'predicted_loan_amount': predicted_loan_amount[0][0],
        'predicted_interest_rate': predicted_loan_amount[0][1]
    })

if __name__ == '__main__':
    app.run(debug=True)
