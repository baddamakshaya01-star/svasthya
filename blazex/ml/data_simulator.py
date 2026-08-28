import pandas as pd
import numpy as np
import os
import sys

# Ensure blazex is in the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from blazex.calculators import calculate_wbgt_estimation, calculate_heat_index, calculate_utci, calculate_composite_score

def generate_synthetic_data(num_samples=2000, output_path="historical_data.csv"):
    np.random.seed(42)
    
    # Generate random weather features
    temp_c = np.random.uniform(20, 45, num_samples)
    rh = np.random.uniform(20, 90, num_samples)
    wind = np.random.uniform(0, 15, num_samples)
    solar = np.random.uniform(0, 1000, num_samples)
    
    # Generate demographic features
    elderly_pct = np.random.uniform(5, 30, num_samples)
    outdoor_worker = np.random.uniform(0.1, 0.9, num_samples)
    informal_settlement = np.random.uniform(0.1, 0.9, num_samples)
    
    # Calculate composite score for each row
    composite_scores = []
    for i in range(num_samples):
        wbgt = calculate_wbgt_estimation(temp_c[i], rh[i], wind[i], solar[i])
        hi = calculate_heat_index(temp_c[i], rh[i])
        utci = calculate_utci(temp_c[i], rh[i], wind[i], solar[i])
        score, _ = calculate_composite_score(wbgt, hi, utci)
        composite_scores.append(score)
        
    composite_scores = np.array(composite_scores)
    
    # Synthesize hospitalization risk
    # Base risk is an exponential function of composite score
    base_risk = (composite_scores / 100.0) ** 2.5
    
    # Modifiers
    vulnerability_modifier = (
        (elderly_pct / 30.0) * 0.4 +
        outdoor_worker * 0.3 +
        informal_settlement * 0.3
    )
    
    # Final risk (scale to 0-1)
    risk = base_risk * (0.5 + 0.5 * vulnerability_modifier)
    # Add some random noise
    risk += np.random.normal(0, 0.05, num_samples)
    risk = np.clip(risk, 0.0, 1.0)
    
    df = pd.DataFrame({
        'temperature_c': temp_c,
        'relative_humidity': rh,
        'wind_speed_ms': wind,
        'solar_radiation': solar,
        'composite_score': composite_scores,
        'elderly_population_pct': elderly_pct,
        'outdoor_worker_density': outdoor_worker,
        'informal_settlement_density': informal_settlement,
        'hospitalization_risk_index': risk
    })
    
    df.to_csv(output_path, index=False)
    print(f"Generated {num_samples} samples and saved to {output_path}")
    return df

if __name__ == "__main__":
    generate_synthetic_data(output_path=os.path.join(os.path.dirname(__file__), "historical_data.csv"))
