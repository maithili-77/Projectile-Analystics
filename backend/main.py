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

from backend.services.model_loader import load_all_models
from backend.services.analytics_service import cache_dataset_summaries, get_dataset_summary, get_all_datasets_metadata
from backend.services.prediction_service import predict_trajectory_service, predict_performance_service, predict_v50_service
from backend.schemas.input_models import TrajectoryInput, PerformanceInput, V50Input
from backend.schemas.prediction import PredictionResult
from backend.utils.model_registry import registry

app = FastAPI(
    title="Advanced Ballistic Analytics & Simulation Platform API",
    description="Academic ML & Computational Physics Research API",
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
        "academic_notice": "Academic Research & Machine Learning Visualization Platform",
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

# 5. Trajectory Prediction Endpoint
@app.post("/api/predict/trajectory", response_model=PredictionResult)
def predict_trajectory(input_data: TrajectoryInput):
    """POST /api/predict/trajectory - Predicts downrange distance and max height from velocity, angle, gravity."""
    try:
        return predict_trajectory_service(input_data)
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
        return predict_performance_service(input_data)
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
        return predict_v50_service(input_data)
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
