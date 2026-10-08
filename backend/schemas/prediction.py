"""
Prediction Response Schema
Defines standardized prediction response format including domain coverage and validation metadata.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Union, Optional

class PredictionResult(BaseModel):
    prediction: Union[Dict[str, Any], float, int] = Field(..., description="Target model prediction output")
    model_name: str = Field(..., description="Name of the machine learning model utilized")
    input_valid: bool = Field(True, description="Whether the input passed validation checks")
    domain_score: float = Field(..., description="Input Domain Coverage score (0.0 to 1.0)")
    domain_coverage_explanation: str = Field(
        "Input Domain Coverage measures similarity to the training data and is not probability of correctness.",
        description="Explicit explanation of domain score definition"
    )
    warnings: List[str] = Field(default_factory=list, description="Validation or boundary warning messages")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Offline benchmark metrics for the model used")
    feature_importances: Optional[List[Dict[str, Any]]] = Field(None, description="Actual feature importance values extracted from trained estimator")

