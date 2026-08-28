import pytest
from blazex.calculators import (
    calculate_heat_index,
    calculate_apparent_temperature,
    calculate_wbgt_estimation,
    determine_warning_level,
    calculate_utci,
    calculate_composite_score,
    celsius_to_fahrenheit,
    fahrenheit_to_celsius
)

def test_temperature_conversion():
    assert celsius_to_fahrenheit(0) == 32
    assert celsius_to_fahrenheit(100) == 212
    assert fahrenheit_to_celsius(32) == 0
    assert fahrenheit_to_celsius(212) == 100

def test_calculate_heat_index():
    # Example: 30C (86F) and 70% RH -> HI should be around 35C (95F)
    hi = calculate_heat_index(30, 70)
    assert 34 < hi < 36
    
    # Below 80F (26.6C), HI should be calculated differently but still be reasonable
    hi_cool = calculate_heat_index(20, 50)
    assert 19 < hi_cool < 21

def test_calculate_apparent_temperature():
    # Base temp 30, RH 50, Wind 0 -> should be higher than 30 due to humidity
    at = calculate_apparent_temperature(30, 50, 0)
    assert at > 30
    
    # Base temp 30, RH 50, Wind 10m/s -> should be lower than previous due to wind chill effect
    at_windy = calculate_apparent_temperature(30, 50, 10)
    assert at_windy < at

def test_calculate_wbgt_estimation():
    # Simplified test
    wbgt = calculate_wbgt_estimation(30, 50, 0, 0)
    # Check that it's a valid number
    assert isinstance(wbgt, float)
    
    # With solar radiation, wbgt should increase
    wbgt_sun = calculate_wbgt_estimation(30, 50, 0, 800)
    assert wbgt_sun > wbgt

def test_determine_warning_level():
    assert determine_warning_level(20) == "Normal"
    assert determine_warning_level(26) == "Caution"
    assert determine_warning_level(28) == "Extreme Caution"
    assert determine_warning_level(30) == "Danger"
    assert determine_warning_level(35) == "Extreme Danger"

def test_calculate_utci():
    # Base case
    utci_val = calculate_utci(30, 50, 2.0, 0)
    assert isinstance(utci_val, float)
    
    # Wind should reduce UTCI
    utci_windy = calculate_utci(30, 50, 10.0, 0)
    assert utci_windy < utci_val
    
    # Solar radiation should increase UTCI
    utci_sun = calculate_utci(30, 50, 2.0, 800)
    assert utci_sun > utci_val

def test_calculate_composite_score():
    score, category = calculate_composite_score(22, 26, 22)
    assert 0 <= score <= 100
    assert category == "Low Risk"
    
    score, category = calculate_composite_score(33, 45, 40)
    assert score > 50
    assert "Risk" in category
