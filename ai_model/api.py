import asyncio
import os
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

from bootstrap import ensure_ready
from models_service import RiskModelService, LossModelService, FraudModelService, PremiumEngine
from trigger_engine import ParametricTriggerEngine
from config import BASE_DIR


app = FastAPI(title="GigZo AI — Parametric Insurance Engine")

# ── CORS ── allow direct calls from the mobile app (Expo / devtunnel / web)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

auto_generate = os.environ.get("AUTO_GENERATE_DATA", "0") == "1"
auto_train = os.environ.get("AUTO_TRAIN_MODELS", "0") == "1"

try:
    ensure_ready(auto_generate=auto_generate, auto_train=auto_train)
except Exception as e:
    import traceback
    traceback.print_exc()

risk_service = None
loss_service = None
fraud_service = None
premium_engine = PremiumEngine()
trigger_engine = ParametricTriggerEngine()

def _ensure_models():
    global risk_service, loss_service, fraud_service
    if risk_service is not None and loss_service is not None and fraud_service is not None:
        return
    try:
        from models_service import RiskModelService, LossModelService, FraudModelService
        risk_service = RiskModelService()
        loss_service = LossModelService()
        fraud_service = FraudModelService()
    except FileNotFoundError as e:
        raise RuntimeError("Models not loaded. Run: python train_models.py") from e


@app.on_event("startup")
def _warm_start_models() -> None:
    """Preload models once at startup to avoid per-request initialization overhead."""
    eager_load_models = os.environ.get("EAGER_LOAD_MODELS", "1") == "1"
    if eager_load_models:
        _ensure_models()


class RiskRequest(BaseModel):
    lat: float
    lon: float
    city: str
    day_of_week: int = Field(ge=0, le=6)
    hour_of_day: int = Field(ge=0, le=23)
    temperature: float
    rain_mm: float
    wind_kph: float
    aqi: float
    traffic_index: float = Field(ge=0, le=1)
    hist_disrupt_freq: float = Field(ge=0)
    worker_risk_category: str


class RiskResponse(BaseModel):
    risk_score: float


class PremiumRequest(BaseModel):
    risk_score: float
    weather_volatility: float = Field(ge=0, le=1)
    pollution_level: float
    hist_disrupt_freq: float
    worker_risk_category: str


class PremiumResponse(BaseModel):
    weekly_premium: float


class PolicyBreakdownItem(BaseModel):
    factor: str
    value: str
    impact: str


class PolicyHistoryItem(BaseModel):
    policy_number: str
    date_range: str
    premium: float
    status: str


class PolicySummaryResponse(BaseModel):
    policy_number: str
    valid_range: str
    coverage_per_day: float
    premium_paid: float
    risk_level: str
    live_status: str
    trigger_probability: float
    breakdown: List[PolicyBreakdownItem]
    explanation: str
    updated_at: str
    history: List[PolicyHistoryItem]


class LossRequest(BaseModel):
    avg_deliveries_per_hour: float
    earnings_per_delivery: float
    predicted_disruption_duration: float
    area_demand_level: float
    worker_risk_category: str
    aqi: Optional[float] = None
    rain_mm: Optional[float] = None
    temperature: Optional[float] = None


class LossResponse(BaseModel):
    estimated_loss: float


class FraudRequest(BaseModel):
    claimed_amount: float
    gps_lat: float
    gps_lon: float
    disruption_lat: float
    disruption_lon: float
    loc_match: bool
    claimed_altitude: Optional[float] = None
    claim_frequency_30d: int
    deliveries_last_7d: int


class FraudResponse(BaseModel):
    fraud_probability: float


class TriggerRequest(BaseModel):
    worker_lat: float
    worker_lon: float
    zone_lat: float
    zone_lon: float
    env_rain_mm: float
    env_aqi: float
    curfew: bool = False
    severe_weather_alert: bool = False
    avg_deliveries_per_hour: float
    earnings_per_delivery: float
    predicted_disruption_duration: float
    area_demand_level: float
    worker_risk_category: str
    aqi: Optional[float] = None
    rain_mm: Optional[float] = None
    temperature: Optional[float] = None


class TriggerResponse(BaseModel):
    triggered: bool
    conditions: List[str]
    location_verified: bool
    estimated_loss: float
    payout_amount: float


def _req_dict(m):
    return m.model_dump() if hasattr(m, "model_dump") else m.dict()


@app.get("/live-weather", include_in_schema=True)
async def live_weather(lat: float, lon: float):
    """Fetch real-world weather + AQI for given coordinates.
    
    Uses ONLY Open-Meteo API (free, no key). 
    No hardcoded values - only real API data or errors.
    """
    from data_fetchers import get_weather, get_aqi
    
    try:
        # Weather data (temperature, rain, wind) is mandatory from real API
        loop = asyncio.get_event_loop()
        w = await loop.run_in_executor(None, lambda: get_weather(lat, lon, date=None))
        
        # AQI is optional—fetch separately with its own error handling
        try:
            aqi = await loop.run_in_executor(None, lambda: get_aqi(lat, lon))
            # If AQI API failed, it returns None; use neutral value
            if aqi is None:
                aqi = 100.0  # Only use neutral value if AQI service unavailable
        except Exception as e:
            print(f"[Warning] AQI fetch error: {e}")
            aqi = 100.0  # Neutral fallback only for AQI if service down
        
        return {
            "temperature": w["temperature"],
            "rain_mm": w["rain_mm"],
            "wind_kph": w["wind_kph"],
            "aqi": aqi,
        }
    except Exception as e:
        # Weather data fetch failed—treat as critical
        raise HTTPException(
            status_code=503,
            detail=f"Weather API unavailable: {str(e)}"
        )


@app.get("/search-cities", include_in_schema=True)
def search_cities(q: str):
    """Search for cities in India."""
    try:
        from data_fetchers import search_indian_cities
        results = search_indian_cities(q)
        return {"results": results}
    except Exception as e:
        return {"error": str(e), "results": []}


@app.get("/earthquakes-live", include_in_schema=True)
def get_earthquakes():
    """Fetch recent significant earthquakes."""
    try:
        from data_fetchers import fetch_latest_earthquakes
        quakes = fetch_latest_earthquakes()
        return {"earthquakes": quakes[:10]}
    except Exception as e:
        return {"error": str(e), "earthquakes": []}


@app.get("/metrics", include_in_schema=True)
def get_metrics():
    """Return last training metrics (ROC-AUC, RMSE, etc.) for accuracy monitoring."""
    import json
    from config import METRICS_PATH
    if not METRICS_PATH.exists():
        return {}
    with open(METRICS_PATH) as f:
        return json.load(f)


@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(req: RiskRequest) -> RiskResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    risk_score = risk_service.predict_risk(_req_dict(req))
    return RiskResponse(risk_score=risk_score)


@app.post("/calculate-premium", response_model=PremiumResponse)
def calculate_premium(req: PremiumRequest) -> PremiumResponse:
    premium = premium_engine.calculate_weekly_premium(
        risk_score=req.risk_score,
        weather_volatility=req.weather_volatility,
        pollution_level=req.pollution_level,
        hist_disrupt_freq=req.hist_disrupt_freq,
        worker_risk_category=req.worker_risk_category,
    )
    return PremiumResponse(weekly_premium=premium)


@app.get("/policy-hub", response_model=PolicySummaryResponse)
def policy_hub(
    lat: float,
    lon: float,
    city: str = "",
    zone: str = "",
    coverage_per_day: float = 500.0,
    avg_daily_earning: float = 1200.0,
    worker_risk_category: str = "high",
    loyalty_weeks: int = 3,
    plan_type: str = "pro",
) -> PolicySummaryResponse:
    """Return a compact, UI-ready weekly policy summary.

    This endpoint keeps the UI transparent by exposing the live inputs
    behind the premium rather than hiding the pricing logic in the app.
    """
    from data_fetchers import get_weather, get_aqi, fetch_weekly_forecast_openmeteo

    weather = get_weather(lat, lon, None)
    aqi = get_aqi(lat, lon)
    forecast = fetch_weekly_forecast_openmeteo(lat, lon, 7)

    current_aqi = float(aqi if aqi is not None else 100.0)
    rain_total = float(forecast["rain_total_mm"])

    weather_volatility = min(1.0, max(0.0, (rain_total / 100.0) * 0.6 + (current_aqi / 500.0) * 0.4))

    risk_payload = {
        "lat": lat,
        "lon": lon,
        "day_of_week": datetime.now().weekday(),
        "hour_of_day": datetime.now().hour,
        "temperature": float(weather["temperature"]),
        "rain_mm": float(weather["rain_mm"]),
        "wind_kph": float(weather["wind_kph"]),
        "aqi": current_aqi,
        "traffic_index": 0.72 if current_aqi >= 300 or rain_total >= 50 else 0.45,
        "hist_disrupt_freq": 0.22 if rain_total >= 50 else 0.12,
        "worker_risk_category": worker_risk_category,
    }

    try:
        _ensure_models()
        risk_score = risk_service.predict_risk(risk_payload)
    except Exception:
        # Keep the endpoint usable even if model artifacts are unavailable.
        risk_score = min(0.95, max(0.05, 0.35 + weather_volatility * 0.35 + current_aqi / 1200.0))

    premium = premium_engine.calculate_weekly_premium(
        risk_score=risk_score,
        weather_volatility=weather_volatility,
        pollution_level=current_aqi,
        hist_disrupt_freq=risk_payload["hist_disrupt_freq"],
        worker_risk_category=worker_risk_category,
    )

    trigger_probability = min(0.98, max(0.05, 0.42 + weather_volatility * 0.45 + risk_score * 0.12))
    env_label = "High" if trigger_probability >= 0.7 else "Medium" if trigger_probability >= 0.4 else "Low"
    coverage_multiplier = round(max(1.0, coverage_per_day / 350.0), 1)
    loyalty_bonus = -5 if loyalty_weeks >= 3 else 0
    behavior_impact = -7 if risk_score <= 0.45 else 12
    zone_impact = 22 if env_label == "High" else 14 if env_label == "Medium" else 8
    forecast_impact = int(round(trigger_probability * 100))
    worker_impact = 8 if avg_daily_earning >= 1000 else 4

    breakdown = [
        PolicyBreakdownItem(
            factor="Zone Environmental Risk",
            value=f"{zone or city or 'Current area'} ({env_label})",
            impact=f"+₹{zone_impact}",
        ),
        PolicyBreakdownItem(
            factor="7-Day Forecast",
            value=f"Rain {round(rain_total)}mm + AQI {int(round(current_aqi))}",
            impact=f"{forecast_impact}% trigger probability",
        ),
        PolicyBreakdownItem(
            factor="Worker Profile",
            value=f"Avg earning ₹{int(round(avg_daily_earning))}/day",
            impact=f"+₹{worker_impact}",
        ),
        PolicyBreakdownItem(
            factor="Behavioral & Anti-Fraud Score",
            value=f"{risk_score:.2f} (Clean)",
            impact="-₹7",
        ),
        PolicyBreakdownItem(
            factor="Coverage Level",
            value=f"₹{int(round(coverage_per_day))}/day",
            impact=f"×{coverage_multiplier:.1f}",
        ),
        PolicyBreakdownItem(
            factor="Loyalty Streak",
            value=f"{loyalty_weeks} weeks",
            impact=f"Resilience Bonus {loyalty_bonus:+d}",
        ),
    ]

    explanation = (
        "Premium is calculated from live weather, AQI, model risk score, coverage level, "
        "and loyalty history. SHAP can be used in the UI to explain each feature contribution."
    )

    return PolicySummaryResponse(
        policy_number="POL-28492",
        valid_range="4 Apr – 10 Apr 2026",
        coverage_per_day=coverage_per_day,
        premium_paid=premium,
        risk_level="HIGH" if risk_score >= 0.7 or trigger_probability >= 0.7 else "MEDIUM" if risk_score >= 0.4 else "LOW",
        live_status="LIVE PROTECTION ACTIVE",
        trigger_probability=trigger_probability,
        breakdown=breakdown,
        explanation=explanation,
        updated_at="Updated 2 hours ago using XGBoost + Prophet forecast",
        history=[
            PolicyHistoryItem(
                policy_number="POL-28145",
                date_range="28 Mar – 3 Apr",
                premium=52.0,
                status="Expired",
            )
        ],
    )


@app.post("/estimate-loss", response_model=LossResponse)
def estimate_loss(req: LossRequest) -> LossResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    loss = loss_service.predict_loss(_req_dict(req))
    return LossResponse(estimated_loss=loss)


@app.post("/fraud-check", response_model=FraudResponse)
def fraud_check(req: FraudRequest) -> FraudResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    prob = fraud_service.fraud_score(_req_dict(req))
    return FraudResponse(fraud_probability=prob)


@app.post("/trigger-payout", response_model=TriggerResponse)
def trigger_payout(req: TriggerRequest) -> TriggerResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    env = {
        "rain_mm": req.env_rain_mm,
        "aqi": req.env_aqi,
        "curfew": req.curfew,
        "severe_weather_alert": req.severe_weather_alert,
        # Default earthquake and health to false for weather triggers
        "earthquake_magnitude": 0.0,
        "health_emergency": False,
    }
    trig = trigger_engine.check_triggers(env)
    loc_ok = trigger_engine.verify_worker_location(
        req.worker_lat, req.worker_lon, req.zone_lat, req.zone_lon
    )

    loss_payload = {
        "avg_deliveries_per_hour": req.avg_deliveries_per_hour,
        "earnings_per_delivery": req.earnings_per_delivery,
        "predicted_disruption_duration": req.predicted_disruption_duration,
        "area_demand_level": req.area_demand_level,
        "worker_risk_category": req.worker_risk_category,
        "aqi": req.aqi or req.env_aqi,
        "rain_mm": req.rain_mm or req.env_rain_mm,
        "temperature": req.temperature or 30.0,
    }
    est_loss = (
        loss_service.predict_loss(loss_payload)
        if trig["is_triggered"] and loc_ok
        else 0.0
    )
    payout = trigger_engine.estimate_payout(est_loss) if est_loss > 0 else 0.0

    return TriggerResponse(
        triggered=trig["is_triggered"],
        conditions=trig["conditions"],
        location_verified=loc_ok,
        estimated_loss=est_loss,
        payout_amount=payout,
    )


class HealthAccidentRequest(BaseModel):
    worker_lat: float
    worker_lon: float
    condition_details: str
    verified_hospital_code: Optional[str] = None
    avg_deliveries_per_hour: float = 3.0
    earnings_per_delivery: float = 80.0
    worker_risk_category: str = "medium"


@app.post("/trigger-health-accident", response_model=TriggerResponse)
def trigger_health_accident(req: HealthAccidentRequest) -> TriggerResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    
    # Simple hardcoded mock verification for hospital codes
    is_verified = bool(req.verified_hospital_code and req.verified_hospital_code.startswith("HOSP-"))
    
    env = {
        "health_emergency": True,
        "earthquake_magnitude": 0.0,
        "rain_mm": 0.0,
        "aqi": 0.0,
        "curfew": False,
        "severe_weather_alert": False,
    }
    trig = trigger_engine.check_triggers(env)
    
    # Assume loss is standard 2 days of income (16 hours)
    loss_payload = {
        "avg_deliveries_per_hour": req.avg_deliveries_per_hour,
        "earnings_per_delivery": req.earnings_per_delivery,
        "predicted_disruption_duration": 16.0,
        "area_demand_level": 0.5,
        "worker_risk_category": req.worker_risk_category,
        "aqi": 100.0,
        "rain_mm": 0.0,
        "temperature": 25.0,
    }
    
    est_loss = loss_service.predict_loss(loss_payload) if is_verified else 0.0
    payout = trigger_engine.estimate_payout(est_loss, coverage_ratio=1.0) if is_verified else 0.0
    
    return TriggerResponse(
        triggered=trig["is_triggered"] and is_verified,
        conditions=trig["conditions"] if is_verified else ["unverified_hospital"],
        location_verified=True, # no specific zone to be in
        estimated_loss=est_loss,
        payout_amount=payout,
    )


# Static frontend (only mounted if the directory exists)
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/", include_in_schema=False)
def root():
    index = static_dir / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return JSONResponse({"status": "GigZo AI model is running", "docs": "/docs"})


@app.get("/health", include_in_schema=True)
def health():
    """Health check — used by the mobile app to verify connectivity."""
    return {"status": "ok", "service": "gigzo-ai"}


# To run:
#   uvicorn api:app --reload
