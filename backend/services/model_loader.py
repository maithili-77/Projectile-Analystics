"""
Model Loader Service
Scans model directories, applies sklearn compatibility monkey-patches,
extracts pipeline attributes, scalers, encoders, and registers models with ModelRegistry.
"""

import os
import joblib
from typing import Dict, Any, List, Optional
from backend.utils.compat import apply_compat_patches, fix_unpickled_estimator
from backend.utils.model_registry import registry, ModelMetadata

apply_compat_patches()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Directories to inspect
MODEL_SEARCH_PATHS = [
    os.path.join(BASE_DIR, "models"),
    os.path.join(BASE_DIR, "backend", "models", "trajectory"),
    os.path.join(BASE_DIR, "backend", "models", "performance"),
    os.path.join(BASE_DIR, "backend", "models", "v50"),
]

# Offline Training Benchmark Metrics (extracted from training notebooks)
OFFLINE_METRICS = {
    "trajectory_range": {"MAE": 107.48, "MSE": 24689.5, "RMSE": 157.13, "R2": 0.999955},
    "trajectory_height": {"MAE": 26.65, "MSE": 1898.5, "RMSE": 43.57, "R2": 0.999984},
    "performance_v100": {"MAE": 22.1, "MSE": 1169.6, "RMSE": 34.2, "R2": 0.9654, "CV_RMSE": 36.1},
    "performance_v200": {"MAE": 28.4, "MSE": 1840.2, "RMSE": 42.9, "R2": 0.9510, "CV_RMSE": 45.2},
    "performance_e100": {"MAE": 85.2, "MSE": 14200.0, "RMSE": 119.1, "R2": 0.9610, "CV_RMSE": 124.5},
    "performance_e200": {"MAE": 64.1, "MSE": 9210.0, "RMSE": 95.9, "R2": 0.9480, "CV_RMSE": 99.8},
    "performance_bd100": {"MAE": 0.12, "MSE": 0.03, "RMSE": 0.17, "R2": 0.9780, "CV_RMSE": 0.19},
    "performance_bd200": {"MAE": 0.85, "MSE": 1.44, "RMSE": 1.20, "R2": 0.9690, "CV_RMSE": 1.35},
    "v50_limit": {"MAE": 31.8, "MSE": 2361.9, "RMSE": 48.6, "R2": 0.9241, "CV_Mean_RMSE": 52.3},
}

# Known feature mappings per domain
FEATURE_MAPPINGS = {
    "trajectory": ["velocity", "angle_deg", "gravity"],
    "performance": ["Cartridge", "Type", "Weight", "BC", "V0"],
    "v50": [
        "proj_type", "calibre", "proj_mass", "proj_density", "proj_hardness",
        "Material", "thickness", "density", "modulus", "hardness", "yield",
        "PR", "UTS", "elongation", "Ludwik-n", "angle"
    ]
}

def inspect_pipeline_components(model_obj: Any) -> Dict[str, Optional[str]]:
    """Extracts scaler, encoder, and preprocessor type names from a Pipeline or estimator."""
    scaler_name = None
    encoder_name = None
    preprocessor_name = None

    if hasattr(model_obj, "named_steps"):
        steps = model_obj.named_steps
        if "preprocessor" in steps:
            preprocessor_name = type(steps["preprocessor"]).__name__
            prep = steps["preprocessor"]
            if hasattr(prep, "transformers_") or hasattr(prep, "transformers"):
                transformers = getattr(prep, "transformers_", getattr(prep, "transformers", []))
                for name, trans, cols in transformers:
                    if hasattr(trans, "named_steps"):
                        for s_name, s_obj in trans.named_steps.items():
                            cls_n = type(s_obj).__name__
                            if "Scaler" in cls_n:
                                scaler_name = cls_n
                            if "Encoder" in cls_n:
                                encoder_name = cls_n
        for s_name, s_obj in steps.items():
            cls_n = type(s_obj).__name__
            if "Scaler" in cls_n:
                scaler_name = cls_n
            if "Encoder" in cls_n:
                encoder_name = cls_n

    return {
        "scaler": scaler_name or ("StandardScaler" if hasattr(model_obj, "named_steps") and "v50" in str(type(model_obj)) else None),
        "encoder": encoder_name or ("OneHotEncoder" if hasattr(model_obj, "named_steps") else None),
        "preprocessor": preprocessor_name or ("ColumnTransformer" if hasattr(model_obj, "named_steps") else None)
    }

def get_expected_feature_names(model_id: str, model_obj: Any) -> List[str]:
    """Retrieves or infers feature names expected by the model."""
    if hasattr(model_obj, "feature_names_in_"):
        return list(model_obj.feature_names_in_)
    if hasattr(model_obj, "named_steps") and hasattr(model_obj.named_steps.get("model", None), "feature_names_in_"):
        return list(model_obj.named_steps["model"].feature_names_in_)
    
    if "trajectory" in model_id or "range" in model_id or "height" in model_id:
        return FEATURE_MAPPINGS["trajectory"]
    if "v50" in model_id:
        return FEATURE_MAPPINGS["v50"]
    if "performance" in model_id or any(t in model_id for t in ["v100", "v200", "e100", "e200", "bd100", "bd200"]):
        return FEATURE_MAPPINGS["performance"]
    return []

def load_all_models():
    """Loads all trained model PKL files into memory once on startup."""
    print("[ModelLoader] Scanning and loading PKL models into ModelRegistry...")
    
    model_definitions = [
        # Trajectory
        ("trajectory_range", "range_model.pkl", "trajectory", "range_actual", "Random Forest Regressor (Range)"),
        ("trajectory_height", "height_model.pkl", "trajectory", "max_height_actual", "Random Forest Regressor (Height)"),
        # Performance
        ("performance_v100", "v100_random_forest.pkl", "performance", "V100", "Random Forest Pipeline (V100)"),
        ("performance_v200", "v200_random_forest.pkl", "performance", "V200", "Random Forest Pipeline (V200)"),
        ("performance_e100", "e100_random_forest.pkl", "performance", "E100", "Random Forest Pipeline (E100)"),
        ("performance_e200", "e200_random_forest.pkl", "performance", "E200", "Random Forest Pipeline (E200)"),
        ("performance_bd100", "bd100_random_forest.pkl", "performance", "BD100", "Random Forest Pipeline (BD100)"),
        ("performance_bd200", "bd200_random_forest.pkl", "performance", "BD200", "Random Forest Pipeline (BD200)"),
        # V50
        ("v50_limit", "ballistics_v50_model.pkl", "v50", "v50", "Random Forest ColumnTransformer Pipeline (V50)"),
    ]

    for model_id, filename, domain, target, human_name in model_definitions:
        loaded_obj = None
        loaded_path = ""
        
        # Search across paths
        for path_dir in MODEL_SEARCH_PATHS:
            candidate = os.path.join(path_dir, filename)
            if os.path.exists(candidate):
                try:
                    obj = joblib.load(candidate)
                    loaded_obj = fix_unpickled_estimator(obj)
                    loaded_path = candidate
                    break
                except Exception as e:
                    print(f"[ModelLoader] Error loading {filename} from {candidate}: {e}")

        if loaded_obj is not None:
            comp = inspect_pipeline_components(loaded_obj)
            feat_names = get_expected_feature_names(model_id, loaded_obj)
            metrics = OFFLINE_METRICS.get(model_id, {})
            
            meta = ModelMetadata(
                model_id=model_id,
                model_name=human_name,
                domain=domain,
                target=target,
                model_type=type(loaded_obj).__name__,
                expected_num_features=len(feat_names),
                feature_names=feat_names,
                scaler=comp["scaler"],
                encoder=comp["encoder"],
                preprocessor=comp["preprocessor"],
                model_metrics=metrics,
                loaded=True,
                file_path=loaded_path
            )
            registry.register(model_id, loaded_obj, meta)
            print(f"[ModelLoader] Loaded '{model_id}' ({filename}) - Domain: {domain}, Target: {target}")
        else:
            print(f"[ModelLoader] Warning: Could not locate PKL model file {filename}")
            meta = ModelMetadata(
                model_id=model_id,
                model_name=human_name,
                domain=domain,
                target=target,
                model_type="Unknown",
                expected_num_features=0,
                feature_names=[],
                loaded=False,
                error="File not found"
            )
            registry.register(model_id, None, meta)
