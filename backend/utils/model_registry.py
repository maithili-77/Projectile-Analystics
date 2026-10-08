"""
Model Registry Utility
Manages model metadata, feature requirements, preprocessors, scalers, encoders, and metrics.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

@dataclass
class ModelMetadata:
    model_id: str
    model_name: str
    domain: str                                 # trajectory, performance, or v50
    target: str                                 # range_actual, V100, v50, etc.
    model_type: str                             # Pipeline, RandomForestRegressor, etc.
    expected_num_features: int
    feature_names: List[str]
    scaler: Optional[str] = None
    encoder: Optional[str] = None
    preprocessor: Optional[str] = None
    model_metrics: Dict[str, Any] = field(default_factory=dict)
    loaded: bool = False
    file_path: str = ""
    error: Optional[str] = None

class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, Any] = {}
        self._metadata: Dict[str, ModelMetadata] = {}

    def register(self, model_id: str, model_obj: Any, metadata: ModelMetadata):
        """Registers a loaded model object alongside its metadata."""
        self._models[model_id] = model_obj
        self._metadata[model_id] = metadata

    def get_model(self, model_id: str) -> Optional[Any]:
        """Retrieves a loaded model instance by ID."""
        return self._models.get(model_id)

    def get_metadata(self, model_id: str) -> Optional[ModelMetadata]:
        """Retrieves metadata for a specific model."""
        return self._metadata.get(model_id)

    def get_all_metadata(self) -> Dict[str, Any]:
        """Returns metadata dictionary for all registered models."""
        result = {}
        for mid, meta in self._metadata.items():
            result[mid] = {
                "model_id": meta.model_id,
                "model_name": meta.model_name,
                "domain": meta.domain,
                "target": meta.target,
                "model_type": meta.model_type,
                "expected_num_features": meta.expected_num_features,
                "feature_names": meta.feature_names,
                "scaler": meta.scaler,
                "encoder": meta.encoder,
                "preprocessor": meta.preprocessor,
                "model_metrics": meta.model_metrics,
                "loaded": meta.loaded,
                "file_path": meta.file_path,
                "error": meta.error
            }
        return result

    def get_model_metrics(self) -> Dict[str, Any]:
        """Returns offline benchmark evaluation metrics for all registered models."""
        metrics = {}
        for mid, meta in self._metadata.items():
            if meta.model_metrics:
                metrics[mid] = {
                    "model_name": meta.model_name,
                    "target": meta.target,
                    "domain": meta.domain,
                    "metrics": meta.model_metrics
                }
        return metrics

    def list_models(self) -> List[str]:
        return list(self._models.keys())

# Singleton Registry Instance
registry = ModelRegistry()
