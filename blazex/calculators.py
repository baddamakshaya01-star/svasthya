import math

def celsius_to_fahrenheit(c: float) -> float:
    return (c * 9/5) + 32

def fahrenheit_to_celsius(f: float) -> float:
    return (f - 32) * 5/9

def calculate_heat_index(temp_c: float, rh: float) -> float:
    """
    Calculate the Heat Index (HI) using the Rothfusz regression.
    The formula is designed for temperatures in Fahrenheit, so we convert.
    """
    temp_f = celsius_to_fahrenheit(temp_c)
    
    if temp_f < 80.0:
        # For temperatures below 80F, use the simple Steadman formula
        hi_f = 0.5 * (temp_f + 61.0 + ((temp_f - 68.0) * 1.2) + (rh * 0.094))
        return fahrenheit_to_celsius(hi_f)
        
    # Rothfusz regression
    hi_f = (-42.379 + 
             2.04901523 * temp_f + 
            10.14333127 * rh - 
             0.22475541 * temp_f * rh - 
             0.00683783 * temp_f**2 - 
             0.05481717 * rh**2 + 
             0.00122874 * temp_f**2 * rh + 
             0.00085282 * temp_f * rh**2 - 
             0.00000199 * temp_f**2 * rh**2)
             
    # Adjustments based on RH and Temp
    if rh < 13 and 80 <= temp_f <= 112:
        adjustment = ((13 - rh) / 4) * math.sqrt((17 - abs(temp_f - 95.)) / 17)
        hi_f -= adjustment
    elif rh > 85 and 80 <= temp_f <= 87:
        adjustment = ((rh - 85) / 10) * ((87 - temp_f) / 5)
        hi_f += adjustment
        
    return fahrenheit_to_celsius(hi_f)

def calculate_apparent_temperature(temp_c: float, rh: float, wind_speed_ms: float) -> float:
    """
    Calculate the Australian Apparent Temperature (AT).
    Formula: AT = Ta + 0.33×e - 0.70×ws - 4.00
    where 'e' is water vapour pressure (hPa).
    """
    # Calculate saturation vapour pressure (es) and actual vapour pressure (e)
    # Using the approximation formula
    e = (rh / 100.0) * 6.105 * math.exp((17.27 * temp_c) / (237.7 + temp_c))
    
    at = temp_c + (0.33 * e) - (0.70 * wind_speed_ms) - 4.00
    return at

def calculate_wbgt_estimation(temp_c: float, rh: float, wind_speed_ms: float, solar_radiation: float) -> float:
    """
    Estimate the Wet-Bulb Globe Temperature (WBGT) using an empirical formula.
    This is an approximation often used when exact globe thermometer data isn't available.
    
    We use the Australian Bureau of Meteorology simplified WBGT approximation:
    WBGT = 0.567 * Ta + 0.393 * e + 3.94
    (In a more advanced setup, solar radiation and wind speed strongly affect the globe temp.
    For this module, we will include a generic solar adjustment if solar_rad is provided).
    
    Solar radiation is in W/m^2.
    """
    # Water vapour pressure (e)
    e = (rh / 100.0) * 6.105 * math.exp((17.27 * temp_c) / (237.7 + temp_c))
    
    wbgt = 0.567 * temp_c + 0.393 * e + 3.94
    
    # Simple adjustment for solar radiation and wind speed (pseudo-globe adjustment)
    # This is a very rough empirical adjustment for demonstration of backend capability
    if solar_radiation > 0:
        # Increase WBGT in direct sun, decrease with wind
        solar_effect = (solar_radiation * 0.01) * math.exp(-0.1 * wind_speed_ms)
        wbgt += solar_effect
        
    return wbgt

def determine_warning_level(wbgt_c: float) -> str:
    """
    Determine the heat stress risk level based on WBGT thresholds.
    Typical guidelines (ISO 7243 / OSHA):
    < 25 C : Normal
    25 - 27.7 C: Caution
    27.8 - 29.4 C: Extreme Caution
    29.5 - 31.0 C: Danger
    > 31.1 C: Extreme Danger
    """
    if wbgt_c < 25.0:
        return "Normal"
    elif wbgt_c < 27.8:
        return "Caution"
    elif wbgt_c < 29.5:
        return "Extreme Caution"
    elif wbgt_c < 31.1:
        return "Danger"
    else:
        return "Extreme Danger"

def calculate_utci(temp_c: float, rh: float, wind_speed_ms: float, solar_radiation: float) -> float:
    """
    Calculate an approximation of Universal Thermal Climate Index (UTCI).
    This uses a simplified empirical approximation. For high-precision applications, 
    a full 6th-order polynomial with Mean Radiant Temp (MRT) and vapor pressure is required.
    """
    # Estimate Mean Radiant Temperature (tr)
    tr = temp_c
    if solar_radiation > 0:
        tr = temp_c + (solar_radiation * 0.05) / (max(wind_speed_ms, 0.1) ** 0.5)
        
    dt = tr - temp_c
    
    # Simple linear approximation for UTCI
    humidity_effect = 0.02 * temp_c * (rh - 50) if temp_c > 20 else 0
    wind_effect = -1.5 * wind_speed_ms if temp_c > 10 else -2.5 * wind_speed_ms
    rad_effect = 0.5 * dt
    
    utci_approx = temp_c + humidity_effect + wind_effect + rad_effect
    return float(utci_approx)

def calculate_composite_score(wbgt: float, hi: float, utci_val: float) -> tuple[float, str]:
    """
    Calculates a normalized composite thermal stress score (0-100) based on WBGT, HI, and UTCI.
    Returns (score, risk_category).
    """
    # Normalize each index to a 0-100 scale
    norm_wbgt = max(0.0, min(100.0, (wbgt - 20) / (35 - 20) * 100))
    norm_hi = max(0.0, min(100.0, (hi - 25) / (50 - 25) * 100))
    norm_utci = max(0.0, min(100.0, (utci_val - 20) / (46 - 20) * 100))
    
    # Composite score
    score = (norm_wbgt * 0.4) + (norm_utci * 0.4) + (norm_hi * 0.2)
    
    if score < 25:
        category = "Low Risk"
    elif score < 50:
        category = "Moderate Risk"
    elif score < 75:
        category = "High Risk"
    elif score < 90:
        category = "Very High Risk"
    else:
        category = "Extreme Risk"
        
    return round(score, 2), category
