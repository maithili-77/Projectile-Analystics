"""
Model Registry Service
Handles loading, caching, and management of pre-trained .pkl Machine Learning pipelines.
"""

import os
import joblib
from typing import Dict, Any
from backend.utils.compat import apply_compat_patches, fix_unpickled_estimator

apply_compat_patches()

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))

MODEL_FILES = {
    "trajectory_range": "range_model.pkl",
    "trajectory_height": "height_model.pkl",
    "ballistic_v100": "v100_random_forest.pkl",
    "ballistic_v50": "ballistics_v50_model.pkl",
}

LOADED_MODELS: Dict[str, Any] = {}
MODEL_METADATA: Dict[str, Any] = {}

def load_all_models():
    """Loads all .pkl models into memory with compatibility patches."""
    global LOADED_MODELS, MODEL_METADATA
    
    print(f"[ModelRegistry] Searching for models in: {MODELS_DIR}")
    
    for key, filename in MODEL_FILES.items():
        filepath = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"[ModelRegistry] Warning: Model file {filename} not found at {filepath}")
            MODEL_METADATA[key] = {
                "loaded": False,
                "file": filename,
                "error": "File not found"
            }
            continue
            
        try:
            model_obj = joblib.load(filepath)
            patched_model = fix_unpickled_estimator(model_obj)
            LOADED_MODELS[key] = patched_model
            
            file_size_mb = round(os.path.getsize(filepath) / (1024 * 1024), 2)
            MODEL_METADATA[key] = {
                "loaded": True,
                "file": filename,
                "size_mb": file_size_mb,
                "type": type(patched_model).__name__
            }
            print(f"[ModelRegistry] Successfully loaded '{key}' ({filename}, {file_size_mb} MB)")
        except Exception as e:
            print(f"[ModelRegistry] Error loading '{key}' ({filename}): {str(e)}")
            MODEL_METADATA[key] = {
                "loaded": False,
                "file": filename,
                "error": str(e)
            }

def get_model(name: str):
    """Retrieves a loaded model by key name."""
    if not LOADED_MODELS:
        load_all_models()
    return LOADED_MODELS.get(name)

def get_registry_status() -> Dict[str, Any]:
    """Returns the current readiness and metadata of all registered models."""
    if not MODEL_METADATA:
        load_all_models()
    return {
        "status": "ready" if len(LOADED_MODELS) == len(MODEL_FILES) else "partial",
        "total_models": len(MODEL_FILES),
        "loaded_count": len(LOADED_MODELS),
        "models": MODEL_METADATA
    }
