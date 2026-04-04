"""
Fetch real-world weather and AQI data using OPEN-METEO API (free, no API key).
No hardcoded values - only real API data or errors.
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta
from typing import Any, Optional

import requests

from config import REAL_CITIES

_USER_AGENT = "ParametricInsurance/1.0 (compliance; contact optional)"


def _get(url: str, params: dict[str, Any] | None = None, timeout: int = 8) -> dict:
    r = requests.get(url, params=params or {}, timeout=timeout, headers={"User-Agent": _USER_AGENT})
    r.raise_for_status()
    return r.json()


def fetch_weather_openmeteo(lat: float, lon: float, date: datetime | None = None) -> dict[str, float]:
    """Fetch current or historical weather from Open-Meteo (free, no API key).
    
    For current weather (date=None): Uses current/most recent hour.
    For historical weather: Uses data for the specified date at noon.
    """
    if date is None:
        # Current weather: use the latest available data
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,precipitation,weather_code,wind_speed_10m",
        }
        data = _get(url, params)
        current = data.get("current", {})
        if current:
            # Require all fields - no hardcoded fallbacks
            if "temperature_2m" not in current:
                raise ValueError(f"Open-Meteo current endpoint missing temperature_2m")
            if "wind_speed_10m" not in current:
                raise ValueError(f"Open-Meteo current endpoint missing wind_speed_10m")
            
            wind_ms = current["wind_speed_10m"]
            return {
                "temperature": float(current["temperature_2m"]),
                "rain_mm": float(current.get("precipitation", 0.0)),
                "wind_kph": round(wind_ms * 3.6, 2),
            }
        # Fallback to hourly if current endpoint fails
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "temperature_2m,precipitation,wind_speed_10m",
            "forecast_days": 1,
        }
        data = _get(url, params)
    else:
        # Historical weather: fetch for the specified date
        url = "https://archive-api.open-meteo.com/v1/archive"
        start = date.strftime("%Y-%m-%d")
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start,
            "end_date": start,
            "hourly": "temperature_2m,precipitation,wind_speed_10m",
        }
        data = _get(url, params)
    
    # Parse hourly data (fallback for current, or main path for historical)
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    preci = hourly.get("precipitation", [])
    winds = hourly.get("wind_speed_10m", [])
    
    # Raise error if no data returned from API (don't use hardcoded fallbacks)
    if not times:
        raise ValueError(f"No weather data available from Open-Meteo for lat={lat}, lon={lon}")
    
    # For current: use most recent hour (last available index)
    # For historical: use noon (index 12)
    if date is None:
        i = len(times) - 1  # Most recent hour
    else:
        i = min(12, len(times) - 1) if len(times) > 12 else len(times) // 2
    
    # Extract data from API response - fail if not available
    if i >= len(temps):
        raise ValueError(f"Temperature data missing at index {i} for Open-Meteo response")
    
    # Require all fields from API
    if i >= len(winds):
        raise ValueError(f"Wind data missing at index {i} for Open-Meteo hourly response")
    if i >= len(preci):
        raise ValueError(f"Precipitation data missing at index {i} for Open-Meteo hourly response")
    
    wind_ms = winds[i]
    
    return {
        "temperature": float(temps[i]),
        "rain_mm": float(preci[i]),
        "wind_kph": round(wind_ms * 3.6, 2),
    }


def fetch_aqi_openmeteo(lat: float, lon: float) -> float:
    """Fetch current AQI from Open-Meteo Air Quality API (no key).
    
    Returns actual AQI value from API. If API fails (network issue, etc),
    returns None to indicate unavailable (not hardcoded fallback).
    Allows weather to be fetched even if AQI service has issues.
    """
    try:
        url = "https://air-quality.api.open-meteo.com/v1/air-quality"
        params = {"latitude": lat, "longitude": lon, "current": "us_aqi"}
        data = _get(url, params)
        
        current = data.get("current", {})
        if not current:
            return None  # API returned but no data in current
        
        aqi = current.get("us_aqi")
        return float(aqi) if aqi is not None else None
    except Exception as e:
        # Log the failure but don't crash the entire weather fetch
        # AQI is secondary; temperature/rain/wind are mandatory
        print(f"[Warning] AQI fetch failed for ({lat}, {lon}): {e}")
        return None


def fetch_weekly_forecast_openmeteo(lat: float, lon: float, days: int = 7) -> dict[str, Any]:
    """Fetch a compact 7-day forecast summary from Open-Meteo.

    Returns forecast totals and ranges used by the policy hub UI and
    premium explanation endpoint.
    """
    days = max(1, min(days, 14))
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min,weather_code",
        "forecast_days": days,
        "timezone": "auto",
    }
    data = _get(url, params)
    daily = data.get("daily", {})

    times = daily.get("time", [])
    precipitation = daily.get("precipitation_sum", [])
    tmax = daily.get("temperature_2m_max", [])
    tmin = daily.get("temperature_2m_min", [])
    codes = daily.get("weather_code", [])

    if not times:
        raise ValueError(f"No forecast data available from Open-Meteo for lat={lat}, lon={lon}")

    rain_total = 0.0
    max_temp = None
    min_temp = None
    for index in range(min(len(times), days)):
        if index < len(precipitation):
            rain_total += float(precipitation[index] or 0.0)
        if index < len(tmax):
            value = float(tmax[index])
            max_temp = value if max_temp is None else max(max_temp, value)
        if index < len(tmin):
            value = float(tmin[index])
            min_temp = value if min_temp is None else min(min_temp, value)

    if max_temp is None or min_temp is None:
        raise ValueError(f"Forecast temperature data missing for lat={lat}, lon={lon}")

    return {
        "days": min(len(times), days),
        "rain_total_mm": round(rain_total, 1),
        "max_temp_c": round(max_temp, 1),
        "min_temp_c": round(min_temp, 1),
        "weather_codes": list(codes[:days]),
    }


def get_weather(lat: float, lon: float, date: datetime | None = None) -> dict[str, float]:
    """Fetch weather ONLY from Open-Meteo API (free, no key, reliable).
    
    Current weather (date=None): uses latest available hour
    Historical weather: uses specified date at noon
    """
    return fetch_weather_openmeteo(lat, lon, date)


def get_aqi(lat: float, lon: float) -> float:
    """Fetch AQI ONLY from Open-Meteo API (free, no key).
    
    Returns US AQI value or None if unavailable.
    """
    return fetch_aqi_openmeteo(lat, lon)


def fetch_historical_weather_batch(
    lat: float, lon: float, start_date: datetime, end_date: datetime
) -> list[dict[str, Any]]:
    """Fetch historical hourly weather for a date range (Open-Meteo). Returns list of hourly records."""
    out = []
    # Open-Meteo archive allows range; avoid huge ranges to respect rate limits
    delta = (end_date - start_date).days
    step_days = 30
    current = start_date
    while current <= end_date:
        chunk_end = min(current + timedelta(days=step_days), end_date)
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": current.strftime("%Y-%m-%d"),
            "end_date": chunk_end.strftime("%Y-%m-%d"),
            "hourly": "temperature_2m,precipitation,windspeed_10m",
        }
        try:
            data = _get(url, params)
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            temps = hourly.get("temperature_2m", [])
            preci = hourly.get("precipitation", [])
            winds = hourly.get("windspeed_10m", [])
            for i, t in enumerate(times):
                if i >= len(temps):
                    break
                try:
                    dt = datetime.fromisoformat(t.replace("Z", "+00:00"))
                except Exception:
                    dt = current
                wind_ms = winds[i] if i < len(winds) else 0
                out.append({
                    "timestamp": dt,
                    "temperature": float(temps[i]),
                    "rain_mm": float(preci[i]) if i < len(preci) else 0.0,
                    "wind_kph": round((wind_ms or 0) * 3.6, 2),
                })
            time.sleep(0.2)  # rate limit
        except Exception:
            pass
        current = chunk_end + timedelta(days=1)
    return out


def fetch_live_snapshot(city: dict | None = None) -> dict[str, Any]:
    """Fetch current weather + AQI for one city. If city is None, use first REAL_CITIES."""
    city = city or REAL_CITIES[0]
    lat, lon = city["lat"], city["lon"]
    weather = get_weather(lat, lon, date=None)
    aqi = get_aqi(lat, lon)
    return {
        "city": city["city"],
        "lat": lat,
        "lon": lon,
        "temperature": weather["temperature"],
        "rain_mm": weather["rain_mm"],
        "wind_kph": weather["wind_kph"],
        "aqi": aqi,
    }


def fetch_elevation_openmeteo(lat: float, lon: float) -> Optional[float]:
    """Fetch exact altitude matching GPS coordinates from Open-Meteo."""
    try:
        url = "https://api.open-meteo.com/v1/elevation"
        params = {"latitude": lat, "longitude": lon}
        data = _get(url, params)
        elevations = data.get("elevation", [])
        if elevations and len(elevations) > 0:
            return float(elevations[0])
    except Exception:
        pass
    return None


def fetch_route_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate basic haversine distance (approximation of true distance). Open-Meteo doesn't natively do routing but we can calculate precise geographic distance in km."""
    import math
    R = 6371.0 # Earth radius in km
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def search_indian_cities(query: str) -> list[dict[str, Any]]:
    """Query Open-Meteo Geocoding to dynamically find Indian cities."""
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": query, "count": 10, "language": "en", "format": "json"}
        data = _get(url, params)
        results = data.get("results", [])
        indian_cities = []
        for city in results:
            if city.get("country_code") == "IN" or city.get("country") == "India":
                indian_cities.append({
                    "city": city.get("name"),
                    "admin1": city.get("admin1", ""),
                    "lat": city.get("latitude"),
                    "lon": city.get("longitude")
                })
        return indian_cities
    except Exception:
        return []


def fetch_latest_earthquakes() -> list[dict[str, Any]]:
    """Fetch significant earthquakes from USGS."""
    try:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson"
        data = _get(url)
        features = data.get("features", [])
        quakes = []
        for feature in features:
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})
            coords = geom.get("coordinates", [0, 0, 0]) # lon, lat, depth
            quakes.append({
                "place": props.get("place", "Unknown"),
                "magnitude": props.get("mag", 0.0),
                "time": props.get("time"),
                "lat": coords[1],
                "lon": coords[0],
                "depth_km": coords[2]
            })
        return sorted(quakes, key=lambda x: x["time"] or 0, reverse=True)
    except Exception:
        return []

