from pydantic import BaseModel, Field, ConfigDict

class V50Input(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    proj_type: str = Field(..., description="Projectile type (AP, FSP, Ball, etc.)")
    calibre: float = Field(..., description="Calibre in mm", ge=0.1, le=120.0)
    proj_mass: float = Field(..., description="Projectile mass in grams", ge=0.1, le=5000.0)
    proj_density: float = Field(7.85, description="Projectile density in g/cm^3", ge=0.5, le=25.0)
    proj_hardness: float = Field(60.0, description="Projectile hardness HRC", ge=10.0, le=100.0)
    Material: str = Field(..., description="Target material composition")
    thickness: float = Field(..., description="Target plate thickness in mm", ge=0.1, le=200.0)
    density: float = Field(7.85, description="Target material density in g/cm^3", ge=0.5, le=25.0)
    modulus: float = Field(210.0, description="Elastic modulus in GPa", ge=1.0, le=1000.0)
    hardness: float = Field(200.0, description="Target material hardness HB/HV", ge=10.0, le=1000.0)
    yield_strength: float = Field(400.0, alias="yield", description="Yield strength in MPa", ge=10.0, le=3000.0)
    PR: float = Field(0.3, description="Poisson's Ratio", ge=0.01, le=0.49)
    UTS: float = Field(600.0, description="Ultimate Tensile Strength in MPa", ge=10.0, le=4000.0)
    elongation: float = Field(15.0, description="Elongation percentage (%)", ge=0.1, le=100.0)
    Ludwik_n: float = Field(0.2, alias="Ludwik-n", description="Strain hardening exponent", ge=0.0, le=1.0)
    angle: float = Field(0.0, description="Impact obliquity angle in degrees", ge=0.0, le=85.0)

class V50Prediction(BaseModel):
    predicted_v50: float
    kinetic_energy_at_v50: float
    impact_energy_joules: float
    penetration_probability_at_v50: float = 0.50
    model_used: str = "Random Forest Pipeline (ColumnTransformer)"
