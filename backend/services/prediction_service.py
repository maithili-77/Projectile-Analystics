"""
Prediction Service
Orchestrates model inference using ModelRegistry, validation_service, and domain_service.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
from backend.utils.model_registry import registry
from backend.schemas.input_models import TrajectoryInput, PerformanceInput, V50Input
from backend.schemas.prediction import PredictionResult
from backend.services.validation_service import validate_input
from backend.services.domain_service import calculate_domain_coverage

def predict_trajectory_service(input_data: TrajectoryInput) -> PredictionResult:
    data_dict = input_data.model_dump()
    is_valid, warnings = validate_input("trajectory", data_dict)
    domain_score, explanation = calculate_domain_coverage("trajectory", data_dict)

    df_input = pd.DataFrame([data_dict])

    range_model = registry.get_model("trajectory_range")
    height_model = registry.get_model("trajectory_height")

    pred_range = float(range_model.predict(df_input)[0]) if range_model else 0.0
    pred_height = float(height_model.predict(df_input)[0]) if height_model else 0.0

    prediction_out = {
        "range_actual": round(pred_range, 2),
        "max_height_actual": round(pred_height, 2)
    }

    meta_range = registry.get_metadata("trajectory_range")
    model_name = meta_range.model_name if meta_range else "Random Forest Regressor"
    metrics = meta_range.model_metrics if meta_range else {}

    # Extract actual feature importances from trained model pipeline
    feature_importances = None
    if range_model:
        try:
            estimator = range_model.steps[-1][1] if hasattr(range_model, 'steps') else range_model
            if hasattr(estimator, 'feature_importances_'):
                raw_importances = estimator.feature_importances_
                feature_names = meta_range.feature_names if (meta_range and meta_range.feature_names) else ["velocity", "angle_deg", "gravity"]
                feature_importances = [
                    {"feature": fname, "importance": round(float(imp), 4)}
                    for fname, imp in zip(feature_names, raw_importances)
                ]
        except Exception:
            feature_importances = None

    return PredictionResult(
        prediction=prediction_out,
        model_name=model_name,
        input_valid=is_valid,
        domain_score=domain_score,
        domain_coverage_explanation=explanation,
        warnings=warnings,
        metrics=metrics,
        feature_importances=feature_importances
    )


def predict_performance_service(input_data: PerformanceInput) -> PredictionResult:
    data_dict = input_data.model_dump(exclude={"targets"})
    is_valid, warnings = validate_input("performance", data_dict)
    domain_score, explanation = calculate_domain_coverage("performance", data_dict)

    cartridge_clean = input_data.Cartridge.strip()
    if cartridge_clean.startswith("."):
        cartridge_clean = cartridge_clean[1:]

    df_input = pd.DataFrame([{
        "Cartridge": cartridge_clean,
        "Type": input_data.Type,
        "Weight": input_data.Weight,
        "BC": input_data.BC,
        "V0": input_data.V0
    }])

    # Possible targets mapping to model registry keys
    target_models = {
        "V100": "performance_v100",
        "V200": "performance_v200",
        "E100": "performance_e100",
        "E200": "performance_e200",
        "BD100": "performance_bd100",
        "BD200": "performance_bd200",
    }

    requested_targets = input_data.targets or list(target_models.keys())
    predictions_out: Dict[str, float] = {}

    for target_key in requested_targets:
        if target_key in target_models:
            model_id = target_models[target_key]
            model_obj = registry.get_model(model_id)
            if model_obj:
                try:
                    val = float(model_obj.predict(df_input)[0])
                    predictions_out[target_key] = round(val, 2)
                except Exception as e:
                    warnings.append(f"Failed prediction for target '{target_key}': {e}")
            else:
                warnings.append(f"Model artifact for target '{target_key}' not loaded.")

    meta_v100 = registry.get_metadata("performance_v100")
    model_name = meta_v100.model_name if meta_v100 else "Random Forest Performance Pipelines"
    metrics = meta_v100.model_metrics if meta_v100 else {}

    return PredictionResult(
        prediction=predictions_out,
        model_name=model_name,
        input_valid=is_valid,
        domain_score=domain_score,
        domain_coverage_explanation=explanation,
        warnings=warnings,
        metrics=metrics
    )

def predict_v50_service(input_data: V50Input) -> PredictionResult:
    data_dict = input_data.model_dump(by_alias=True)
    is_valid, warnings = validate_input("v50", data_dict)
    domain_score, explanation = calculate_domain_coverage("v50", data_dict)

    df_input = pd.DataFrame([data_dict])

    v50_model = registry.get_model("v50_limit")
    pred_v50 = float(v50_model.predict(df_input)[0]) if v50_model else 0.0

    prediction_out = {
        "v50": round(pred_v50, 2)
    }

    meta_v50 = registry.get_metadata("v50_limit")
    model_name = meta_v50.model_name if meta_v50 else "Random Forest ColumnTransformer Pipeline"
    metrics = meta_v50.model_metrics if meta_v50 else {}

    return PredictionResult(
        prediction=prediction_out,
        model_name=model_name,
        input_valid=is_valid,
        domain_score=domain_score,
        domain_coverage_explanation=explanation,
        warnings=warnings,
        metrics=metrics
    )
