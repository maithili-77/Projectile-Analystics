from pydantic import BaseModel, Field

class BallisticInput(BaseModel):
    Cartridge: str = Field(..., description="Cartridge designation name")
    Type: str = Field(..., description="Firearm platform type: Rifle, Handgun, Shotgun, etc.")
    Weight: float = Field(..., description="Bullet weight in grains", ge=1.0, le=1000.0)
    BC: float = Field(..., description="Ballistic coefficient", ge=0.01, le=1.5)
    V0: float = Field(..., description="Muzzle velocity in feet per second (fps)", ge=100.0, le=5000.0)

class BallisticPrediction(BaseModel):
    Cartridge: str
    Type: str
    Weight: float
    BC: float
    V0: float
    V100: float
    V200: float
    E0: float
    E100: float
    E200: float
    BD100: float
    BD200: float
    model_used: str = "Random Forest Pipeline"
