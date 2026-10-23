"""
Advanced Ballistic Analytics and Simulation Platform - FastAPI Backend
Main API Entrypoint implementing all required endpoints, model registry initialization,
dataset summary caching, input validation, and domain coverage evaluation.
"""

import sys
import os

# Ensure both project root and backend directory are in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.abspath(os.path.dirname(__file__))

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
from datetime import datetime

from backend.services.model_loader import load_all_models
from backend.services.analytics_service import cache_dataset_summaries, get_dataset_summary, get_all_datasets_metadata
from backend.services.prediction_service import predict_trajectory_service, predict_performance_service, predict_v50_service
from backend.services.simulator_service import run_simulation
from backend.schemas.input_models import TrajectoryInput, PerformanceInput, V50Input
from backend.schemas.trajectory import SimulationRequest, SimulationResponse
from backend.schemas.prediction import PredictionResult
from backend.utils.model_registry import registry

app = FastAPI(
    title="Ballastic Prediction System API",
    description="Ballastic Prediction System - Academic ML & Computational Physics Research API",
    version="2.0.0"
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Server Startup Lifecycle Event: Loads PKL models into memory & caches dataset summaries."""
    print("[FastAPI] Executing server startup lifecycle tasks...")
    load_all_models()
    cache_dataset_summaries()
    print("[FastAPI] Startup initialization complete.")

# 1. Healthcheck Endpoint
@app.get("/api/health")
def get_health():
    """GET /api/health - Returns API health and model registry readiness status."""
    all_meta = registry.get_all_metadata()
    loaded_count = sum(1 for m in all_meta.values() if m.get("loaded"))
    total_count = len(all_meta)
    
    return {
        "status": "online",
        "platform": "Ballastic Prediction System",
        "academic_notice": "Ballastic Prediction System - Academic Research & Machine Learning Visualization Platform",
        "models_loaded": f"{loaded_count}/{total_count}",
        "registry": all_meta
    }

# 2. Registered Models Metadata Endpoint
@app.get("/api/models")
def get_models():
    """GET /api/models - Returns details, feature names, scalers, encoders, and preprocessors for all models."""
    return registry.get_all_metadata()

# 3. All Datasets Metadata Endpoint
@app.get("/api/datasets")
def get_datasets():
    """GET /api/datasets - Returns metadata and summary metrics for all project datasets."""
    return get_all_datasets_metadata()

# 4. Model Offline Benchmark Metrics Endpoint
@app.get("/api/model/metrics")
def get_model_metrics():
    """GET /api/model/metrics - Returns offline training R^2, RMSE, MAE benchmarks for models."""
    return registry.get_model_metrics()

# In-memory prediction history log
prediction_history_db: List[Dict[str, Any]] = []

def record_backend_history(domain: str, input_dict: Dict[str, Any], pred_result: PredictionResult):
    item = {
        "id": f"pred_{int(datetime.utcnow().timestamp() * 1000)}",
        "type": domain,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model_name": pred_result.model_name,
        "domain_score": pred_result.domain_score,
        "domain_coverage_explanation": pred_result.domain_coverage_explanation,
        "input": input_dict,
        "output": pred_result.prediction
    }
    prediction_history_db.insert(0, item)
    if len(prediction_history_db) > 100:
        prediction_history_db.pop()

# 5. Trajectory Prediction Endpoint
@app.post("/api/predict/trajectory", response_model=PredictionResult)
def predict_trajectory(input_data: TrajectoryInput):
    """POST /api/predict/trajectory - Predicts downrange distance and max height from velocity, angle, gravity."""
    try:
        res = predict_trajectory_service(input_data)
        record_backend_history("Trajectory", input_data.model_dump(), res)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trajectory prediction error: {str(e)}"
        )

# 6. Cartridge Performance Prediction Endpoint
@app.post("/api/predict/performance", response_model=PredictionResult)
def predict_performance(input_data: PerformanceInput):
    """POST /api/predict/performance - Predicts V100, V200, E100, E200, BD100, BD200 for small arms cartridges."""
    try:
        res = predict_performance_service(input_data)
        record_backend_history("Performance", input_data.model_dump(), res)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Performance prediction error: {str(e)}"
        )

# 7. V50 Armor Limit Velocity Prediction Endpoint
@app.post("/api/predict/v50", response_model=PredictionResult)
def predict_v50(input_data: V50Input):
    """POST /api/predict/v50 - Predicts 50% armor perforation threshold velocity (V50)."""
    try:
        res = predict_v50_service(input_data)
        record_backend_history("V50", input_data.model_dump(), res)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"V50 prediction error: {str(e)}"
        )

# 8. Trajectory Dataset Summary Endpoint
@app.get("/api/dataset/summary/trajectory")
def get_trajectory_summary():
    """GET /api/dataset/summary/trajectory - Returns cached summary for accurate_ballastic.csv."""
    return get_dataset_summary("trajectory")

# 9. Performance Dataset Summary Endpoint
@app.get("/api/dataset/summary/performance")
def get_performance_summary():
    """GET /api/dataset/summary/performance - Returns cached summary for ballistics_500.csv."""
    return get_dataset_summary("performance")

# 10. V50 Dataset Summary Endpoint
@app.get("/api/dataset/summary/v50")
def get_v50_summary():
    """GET /api/dataset/summary/v50 - Returns cached summary for REL_v50_database_20230527.csv."""
    return get_dataset_summary("v50")

# 11. Interactive Simulator Run Endpoint
@app.post("/api/simulator/run", response_model=SimulationResponse)
def simulate_trajectory(input_data: SimulationRequest):
    """POST /api/simulator/run - Computes numerical trajectory integration with aerodynamic drag."""
    try:
        return run_simulation(input_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation calculation error: {str(e)}"
        )

# 12. History Endpoints
@app.get("/api/history")
def get_history():
    """GET /api/history - Returns list of past prediction executions with inputs and readings."""
    return prediction_history_db

@app.delete("/api/history/{item_id}")
def delete_history_item(item_id: str):
    """DELETE /api/history/{item_id} - Deletes a specific prediction item by ID."""
    global prediction_history_db
    before_len = len(prediction_history_db)
    prediction_history_db = [item for item in prediction_history_db if item.get("id") != item_id]
    return {
        "status": "deleted",
        "id": item_id,
        "removed": before_len > len(prediction_history_db)
    }

@app.delete("/api/history")
def clear_history():
    """DELETE /api/history - Clears the prediction history log."""
    prediction_history_db.clear()
    return {"status": "cleared", "count": 0}


