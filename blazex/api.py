from fastapi import APIRouter, HTTPException, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import joblib
import os
import pandas as pd
from blazex.calculators import (
    calculate_heat_index,
    calculate_apparent_temperature,
    calculate_wbgt_estimation,
    determine_warning_level,
    calculate_utci,
    calculate_composite_score
)
from blazex.alerts import (
    AlertEngine,
    add_rule,
    get_all_rules,
    delete_rule,
    get_alert_logs
)

alert_engine = AlertEngine()
router = APIRouter()

# Load the predictive model on startup if it exists
MODEL_PATH = os.path.join(os.path.dirname(__file__), "ml", "models", "risk_model.joblib")
risk_model = None
if os.path.exists(MODEL_PATH):
    risk_model = joblib.load(MODEL_PATH)

class WeatherDataRequest(BaseModel):
    temperature_c: float = Field(..., description="Dry-bulb temperature in Celsius")
    relative_humidity: float = Field(..., ge=0, le=100, description="Relative humidity percentage (0-100)")
    wind_speed_ms: float = Field(0.0, ge=0, description="Wind speed in meters per second")
    solar_radiation: float = Field(0.0, ge=0, description="Solar radiation in W/m^2")

class HeatStressResponse(BaseModel):
    temperature_c: float
    relative_humidity: float
    heat_index_c: float
    apparent_temperature_c: float
    wbgt_c: float
    utci_c: float
    composite_score: float
    composite_risk_category: str
    warning_level: str

@router.post("/evaluate-heat-stress", response_model=HeatStressResponse)
def evaluate_heat_stress(data: WeatherDataRequest):
    try:
        hi = calculate_heat_index(data.temperature_c, data.relative_humidity)
        at = calculate_apparent_temperature(data.temperature_c, data.relative_humidity, data.wind_speed_ms)
        wbgt = calculate_wbgt_estimation(data.temperature_c, data.relative_humidity, data.wind_speed_ms, data.solar_radiation)
        utci_val = calculate_utci(data.temperature_c, data.relative_humidity, data.wind_speed_ms, data.solar_radiation)
        
        warning_level = determine_warning_level(wbgt)
        composite_score, risk_category = calculate_composite_score(wbgt, hi, utci_val)
        
        return HeatStressResponse(
            temperature_c=data.temperature_c,
            relative_humidity=data.relative_humidity,
            heat_index_c=round(hi, 2),
            apparent_temperature_c=round(at, 2),
            wbgt_c=round(wbgt, 2),
            utci_c=round(utci_val, 2),
            composite_score=composite_score,
            composite_risk_category=risk_category,
            warning_level=warning_level
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ForecastDay(BaseModel):
    temperature_c: float
    relative_humidity: float
    wind_speed_ms: float = 0.0
    solar_radiation: float = 0.0

class DemographicData(BaseModel):
    elderly_population_pct: float
    outdoor_worker_density: float
    informal_settlement_density: float

class ForecastRequest(BaseModel):
    forecast: List[ForecastDay]
    demographics: DemographicData

class ForecastRiskResponse(BaseModel):
    day: int
    predicted_hospitalization_risk: float
    risk_tier: str

@router.post("/forecast-risk", response_model=List[ForecastRiskResponse])
def forecast_risk(req: ForecastRequest):
    if risk_model is None:
        raise HTTPException(status_code=503, detail="Predictive model is not available. Please train it first.")
        
    responses = []
    
    try:
        for i, day in enumerate(req.forecast):
            # Calculate indices
            wbgt = calculate_wbgt_estimation(day.temperature_c, day.relative_humidity, day.wind_speed_ms, day.solar_radiation)
            hi = calculate_heat_index(day.temperature_c, day.relative_humidity)
            utci_val = calculate_utci(day.temperature_c, day.relative_humidity, day.wind_speed_ms, day.solar_radiation)
            composite_score, _ = calculate_composite_score(wbgt, hi, utci_val)
            
            # Prepare feature vector for model
            features = pd.DataFrame([{
                'temperature_c': day.temperature_c,
                'relative_humidity': day.relative_humidity,
                'wind_speed_ms': day.wind_speed_ms,
                'solar_radiation': day.solar_radiation,
                'composite_score': composite_score,
                'elderly_population_pct': req.demographics.elderly_population_pct,
                'outdoor_worker_density': req.demographics.outdoor_worker_density,
                'informal_settlement_density': req.demographics.informal_settlement_density
            }])
            
            # Predict
            risk_index = float(risk_model.predict(features)[0])
            # Bound between 0 and 1
            risk_index = max(0.0, min(1.0, risk_index))
            
            # Assign risk tier
            if risk_index < 0.2:
                tier = "Low"
            elif risk_index < 0.4:
                tier = "Moderate"
            elif risk_index < 0.6:
                tier = "High"
            elif risk_index < 0.8:
                tier = "Very High"
            else:
                tier = "Extreme"
                
            responses.append(ForecastRiskResponse(
                day=i+1,
                predicted_hospitalization_risk=round(risk_index, 4),
                risk_tier=tier
            ))
            
        return responses
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class DailyForecast(BaseModel):
    day: int
    predicted_hospitalization_risk: float
    risk_tier: str
    temperature_c: float
    relative_humidity: float
    wbgt_c: float
    hi_c: float
    utci_c: float
    composite_score: float

class WardLocation(BaseModel):
    ward_name: str
    lat: float
    lng: float
    elderly_pct: float
    outdoor_pct: float
    informal_pct: float
    forecasts: List[DailyForecast]

@router.get("/api/risk-forecast", response_model=List[WardLocation])
def get_ward_risk_forecast():
    """
    Simulates fetching a 5-day ahead forecast for multiple city wards.
    This is used by the frontend dashboard.
    """
    import random
    
    if risk_model is None:
        raise HTTPException(status_code=503, detail="Predictive model is not available.")
        
    wards = [
        {"name": "Downtown", "lat": 28.6139, "lng": 77.2090, "elderly_pct": 10.0, "outdoor": 0.2, "informal": 0.1, "base_temp": 38.0},
        {"name": "North Hills", "lat": 28.6839, "lng": 77.2190, "elderly_pct": 25.0, "outdoor": 0.1, "informal": 0.05, "base_temp": 35.0},
        {"name": "Industrial District", "lat": 28.5539, "lng": 77.2790, "elderly_pct": 5.0, "outdoor": 0.9, "informal": 0.4, "base_temp": 40.0},
        {"name": "Eastside Slums", "lat": 28.6339, "lng": 77.3090, "elderly_pct": 15.0, "outdoor": 0.6, "informal": 0.9, "base_temp": 39.0},
        {"name": "Westend Suburbs", "lat": 28.6239, "lng": 77.1090, "elderly_pct": 20.0, "outdoor": 0.1, "informal": 0.0, "base_temp": 34.0},
        {"name": "Central Park Area", "lat": 28.5939, "lng": 77.2290, "elderly_pct": 12.0, "outdoor": 0.5, "informal": 0.1, "base_temp": 33.0},
    ]
    
    responses = []
    
    for ward in wards:
        forecasts = []
        for day in range(5):
            temp = ward["base_temp"] + random.uniform(-1.0, 2.0) + (day * 0.5)
            rh = random.uniform(40.0, 70.0) - (day * 1.5)
            wind = random.uniform(1.0, 5.0)
            solar = random.uniform(600.0, 900.0)
            
            wbgt = calculate_wbgt_estimation(temp, rh, wind, solar)
            hi = calculate_heat_index(temp, rh)
            utci_val = calculate_utci(temp, rh, wind, solar)
            composite_score, _ = calculate_composite_score(wbgt, hi, utci_val)
            
            features = pd.DataFrame([{
                'temperature_c': temp,
                'relative_humidity': rh,
                'wind_speed_ms': wind,
                'solar_radiation': solar,
                'composite_score': composite_score,
                'elderly_population_pct': ward["elderly_pct"],
                'outdoor_worker_density': ward["outdoor"],
                'informal_settlement_density': ward["informal"]
            }])
            
            risk_index = float(risk_model.predict(features)[0])
            risk_index = max(0.0, min(1.0, risk_index))
            
            if risk_index < 0.2:
                tier = "Low"
            elif risk_index < 0.4:
                tier = "Moderate"
            elif risk_index < 0.6:
                tier = "High"
            elif risk_index < 0.8:
                tier = "Very High"
            else:
                tier = "Extreme"
                
            forecasts.append(DailyForecast(
                day=day,
                predicted_hospitalization_risk=round(risk_index, 4),
                risk_tier=tier,
                temperature_c=round(temp, 1),
                relative_humidity=round(rh, 1),
                wbgt_c=round(wbgt, 1),
                hi_c=round(hi, 1),
                utci_c=round(utci_val, 1),
                composite_score=round(composite_score, 1)
            ))
            
            # Evaluate alerts for current day (Day 0)
            if day == 0:
                alert_engine.evaluate_and_alert(ward["name"], risk_index)
            
        responses.append(WardLocation(
            ward_name=ward["name"],
            lat=ward["lat"],
            lng=ward["lng"],
            elderly_pct=ward["elderly_pct"],
            outdoor_pct=ward["outdoor"],
            informal_pct=ward["informal"],
            forecasts=forecasts
        ))
        
    return responses

class RuleCreateRequest(BaseModel):
    ward_name: str
    risk_threshold: float
    action_type: str
    phone_number: str

@router.post("/api/alerts/rules")
def create_alert_rule(req: RuleCreateRequest):
    rule_id = add_rule(req.ward_name, req.risk_threshold, req.action_type, req.phone_number)
    return {"status": "success", "rule_id": rule_id}

@router.get("/api/alerts/rules")
def list_alert_rules():
    return get_all_rules()

@router.delete("/api/alerts/rules/{rule_id}")
def remove_alert_rule(rule_id: int):
    delete_rule(rule_id)
    return {"status": "success"}

@router.get("/api/alerts/logs")
def fetch_alert_logs(limit: int = 50):
    return get_alert_logs(limit)
