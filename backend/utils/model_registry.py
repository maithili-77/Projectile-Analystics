from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Callable


@dataclass
class ModelMetadata:
    model_id: str
    model_name: str
    domain: str
    target: str
    model_type: str
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
        self._loader: Optional[Callable[[str], Any]] = None
        self._attempted = set()

    def set_loader(self, loader):
        self._loader = loader

    def register(self, model_id, model_obj, metadata):
        self._models[model_id] = model_obj
        self._metadata[model_id] = metadata
        if model_obj is not None:
            self._attempted.add(model_id)

    def get_model(self, model_id):
        model = self._models.get(model_id)
        if model is not None:
            return model

        if model_id in self._attempted or self._loader is None:
            return None

        self._attempted.add(model_id)
        try:
            return self._loader(model_id)
        except Exception as exc:
            meta = self._metadata.get(model_id)
            if meta:
                meta.error = str(exc)
            print(f"[ModelRegistry] Could not load {model_id}: {exc}")
            return None

    def get_metadata(self, model_id):
        return self._metadata.get(model_id)

    def get_all_metadata(self):
        return {
            mid: {
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
                "error": meta.error,
            }
            for mid, meta in self._metadata.items()
        }

    def get_model_metrics(self):
        return {
            mid: {
                "model_name": meta.model_name,
                "target": meta.target,
                "domain": meta.domain,
                "metrics": meta.model_metrics,
            }
            for mid, meta in self._metadata.items()
            if meta.model_metrics
        }

    def list_models(self):
        return [
            model_id for model_id, model in self._models.items()
            if model is not None
        ]


registry = ModelRegistry()
