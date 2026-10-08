from pydantic import BaseModel, Field
from typing import List

class TrajectoryInput(BaseModel):
    velocity: float = Field(..., description="Initial muzzle velocity in m/s", ge=10.0, le=3000.0)
    angle_deg: float = Field(..., description="Launch elevation angle in degrees", ge=0.1, le=89.9)
    gravity: float = Field(9.81, description="Gravitational acceleration in m/s^2", ge=1.0, le=30.0)

class TrajectoryPrediction(BaseModel):
    velocity: float
    angle_deg: float
    gravity: float
    predicted_range: float
    predicted_max_height: float
    theoretical_range: float
    theoretical_max_height: float
    flight_time: float
    model_used: str = "Random Forest Regressor"

class SimulationRequest(BaseModel):
    velocity: float = Field(500.0, ge=10.0, le=3000.0)
    angle_deg: float = Field(45.0, ge=0.1, le=89.9)
    gravity: float = Field(9.81, ge=1.0, le=30.0)
    mass_kg: float = Field(0.01, ge=0.001, le=50.0)
    drag_coeff: float = Field(0.47, ge=0.0, le=2.0)
    num_points: int = Field(100, ge=20, le=500)

class TrajectoryPoint(BaseModel):
    t: float
    x: float
    y: float
    vx: float
    vy: float
    v: float

class SimulationResponse(BaseModel):
    points: List[TrajectoryPoint]
    max_range: float
    max_height: float
    total_flight_time: float
    apex_time: float
    input_params: SimulationRequest
