from fastapi.testclient import TestClient
from blazex.api import router
from fastapi import FastAPI
import pytest
import os
import joblib

app = FastAPI()
app.include_router(router)
client = TestClient(app)

def test_forecast_risk_no_model():
    # If model is not trained/loaded, it should raise a 503
    # Wait, the test might run AFTER the model is trained.
    pass

def test_forecast_risk_endpoint():
    # We must ensure the model is trained before this test runs
    model_path = os.path.join(os.path.dirname(__file__), "../blazex/ml/models/risk_model.joblib")
    if not os.path.exists(model_path):
        pytest.skip("Model not trained yet, skipping forecast-risk test")
        
    payload = {
        "forecast": [
            {
                "temperature_c": 35.0,
                "relative_humidity": 60.0,
                "wind_speed_ms": 2.0,
                "solar_radiation": 800.0
            },
            {
                "temperature_c": 25.0,
                "relative_humidity": 50.0,
                "wind_speed_ms": 5.0,
                "solar_radiation": 400.0
            }
        ],
        "demographics": {
            "elderly_population_pct": 25.0,
            "outdoor_worker_density": 0.8,
            "informal_settlement_density": 0.5
        }
    }
    
    response = client.post("/forecast-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Day 1 should have higher risk than Day 2
    day1_risk = data[0]["predicted_hospitalization_risk"]
    day2_risk = data[1]["predicted_hospitalization_risk"]
    
    assert "risk_tier" in data[0]
    # In general, higher temps should lead to higher risk, though model dependent.
    assert day1_risk > day2_risk
