"""
Input Models Schema
Pydantic input validation models for Trajectory, Ballistic Performance, and V50 requests.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class TrajectoryInput(BaseModel):
    velocity: float = Field(..., description="Initial launch velocity in m/s", ge=1.0, le=5000.0)
    angle_deg: float = Field(..., description="Elevation launch angle in degrees", ge=0.01, le=89.99)
    gravity: float = Field(9.81, description="Gravitational acceleration in m/s^2", ge=0.1, le=50.0)

class PerformanceInput(BaseModel):
    Cartridge: str = Field(..., description="Cartridge designation string (e.g. 460 WEATHERBY MAGNUM)")
    Type: str = Field(..., description="Firearm platform category (Rifle, Handgun, Shotgun)")
    Weight: float = Field(..., description="Bullet weight in grains", ge=0.1, le=2000.0)
    BC: float = Field(..., description="Ballistic coefficient", ge=0.001, le=2.0)
    V0: float = Field(..., description="Muzzle velocity in feet per second (fps)", ge=10.0, le=6000.0)
    targets: Optional[List[str]] = Field(None, description="Optional list of target variables to predict: V100, V200, E100, E200, BD100, BD200")

class V50Input(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    proj_type: str = Field(..., description="Projectile classification (AP, FSP, Ball, etc.)")
    calibre: float = Field(..., description="Calibre in mm", ge=0.1, le=200.0)
    proj_mass: float = Field(..., description="Projectile mass in grams", ge=0.01, le=10000.0)
    proj_density: float = Field(7.85, description="Projectile density in g/cm^3", ge=0.1, le=30.0)
    proj_hardness: float = Field(60.0, description="Projectile hardness HRC", ge=1.0, le=120.0)
    Material: str = Field(..., description="Target material description")
    thickness: float = Field(..., description="Target plate thickness in mm", ge=0.01, le=500.0)
    density: float = Field(7.85, description="Target material density in g/cm^3", ge=0.1, le=30.0)
    modulus: float = Field(210.0, description="Elastic modulus in GPa", ge=0.1, le=2000.0)
    hardness: float = Field(200.0, description="Target material hardness HB/HV", ge=1.0, le=2000.0)
    yield_strength: float = Field(400.0, alias="yield", description="Yield strength in MPa", ge=1.0, le=5000.0)
    PR: float = Field(0.3, description="Poisson's Ratio", ge=0.0, le=0.5)
    UTS: float = Field(600.0, description="Ultimate Tensile Strength in MPa", ge=1.0, le=6000.0)
    elongation: float = Field(15.0, description="Elongation percentage (%)", ge=0.0, le=100.0)
    Ludwik_n: float = Field(0.2, alias="Ludwik-n", description="Strain hardening exponent", ge=0.0, le=2.0)
    angle: float = Field(0.0, description="Impact obliquity angle in degrees", ge=0.0, le=90.0)
