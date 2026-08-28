import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import xgboost as xgb
import joblib
import os
import sys

# Ensure blazex is in the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Optionally import the simulator to guarantee data exists
try:
    from blazex.ml.data_simulator import generate_synthetic_data
except ImportError:
    pass

def train_and_save_model():
    data_path = os.path.join(os.path.dirname(__file__), "historical_data.csv")
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "risk_model.joblib")
    
    # Generate data if it doesn't exist
    if not os.path.exists(data_path):
        print("Historical data not found. Generating synthetic data...")
        generate_synthetic_data(num_samples=2000, output_path=data_path)
        
    df = pd.read_csv(data_path)
    
    # Features for the model
    # We include both the raw weather data and the composite score for maximum predictive power
    # along with the demographic vulnerabilities.
    features = [
        'temperature_c',
        'relative_humidity',
        'wind_speed_ms',
        'solar_radiation',
        'composite_score',
        'elderly_population_pct',
        'outdoor_worker_density',
        'informal_settlement_density'
    ]
    target = 'hospitalization_risk_index'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Regressor...")
    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Evaluation Metrics:")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2 Score: {r2:.4f}")
    
    # Save the model
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
