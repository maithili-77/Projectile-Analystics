"""
Validation Service
Validates user input data against model feature count, expected data types, range bounds, and categorical domains.
"""

from typing import Dict, Any, List, Tuple
from backend.utils.model_registry import registry

# Valid categorical categories learned from training datasets
KNOWN_CATEGORIES = {
    "Type": {"Rifle", "Handgun", "Shotgun"},
    "proj_type": {"AP", "FSP", "Ball", "Steel Core", "Heavy AP"},
    "Material": {"Steel", "Aluminum", "Titanium", "Composite", "Armor Steel", "Aluminium"}
}

def validate_input(domain: str, data_dict: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates input dictionary for a given domain ('trajectory', 'performance', 'v50').
    Checks missing values, wrong types, invalid numeric bounds, unknown categories, and feature count.
    """
    warnings: List[str] = []
    is_valid = True

    # 1. Missing values check
    for key, val in data_dict.items():
        if val is None or val == "":
            warnings.append(f"Missing value detected for feature '{key}'.")
            is_valid = False

    # 2. Domain-specific validation checks
    if domain == "trajectory":
        expected_features = ["velocity", "angle_deg", "gravity"]
        if len(data_dict) < len(expected_features):
            warnings.append(f"Feature count mismatch: Expected at least {len(expected_features)} features, received {len(data_dict)}.")
            is_valid = False

        v = data_dict.get("velocity", 0)
        a = data_dict.get("angle_deg", 0)
        g = data_dict.get("gravity", 0)

        if not isinstance(v, (int, float)) or v <= 0:
            warnings.append(f"Invalid velocity '{v}': Must be a positive number.")
            is_valid = False
        elif v > 3000:
            warnings.append(f"High velocity '{v} m/s' exceeds typical experimental bounds (<= 3000 m/s).")

        if not isinstance(a, (int, float)) or a <= 0 or a >= 90:
            warnings.append(f"Invalid launch angle '{a}°': Must be between 0° and 90°.")
            is_valid = False

        if not isinstance(g, (int, float)) or g <= 0:
            warnings.append(f"Invalid gravity acceleration '{g} m/s^2': Must be a positive value.")
            is_valid = False

    elif domain == "performance":
        expected_features = ["Cartridge", "Type", "Weight", "BC", "V0"]
        
        type_val = data_dict.get("Type")
        if type_val and type_val not in KNOWN_CATEGORIES["Type"]:
            warnings.append(f"Unknown firearm category '{type_val}'. Known categories: {list(KNOWN_CATEGORIES['Type'])}.")

        weight = data_dict.get("Weight", 0)
        if not isinstance(weight, (int, float)) or weight <= 0:
            warnings.append(f"Invalid bullet weight '{weight} gr': Must be positive.")
            is_valid = False

        bc = data_dict.get("BC", 0)
        if not isinstance(bc, (int, float)) or bc <= 0 or bc > 2.5:
            warnings.append(f"Invalid Ballistic Coefficient (BC) '{bc}': Expected range (0, 2.5].")

        v0 = data_dict.get("V0", 0)
        if not isinstance(v0, (int, float)) or v0 <= 0:
            warnings.append(f"Invalid muzzle velocity V0 '{v0} fps': Must be positive.")
            is_valid = False

    elif domain == "v50":
        expected_count = 16
        
        proj_type = data_dict.get("proj_type")
        if proj_type and proj_type not in KNOWN_CATEGORIES["proj_type"]:
            warnings.append(f"Unknown projectile type '{proj_type}'. Known: {list(KNOWN_CATEGORIES['proj_type'])}.")

        mat = data_dict.get("Material")
        if mat and mat not in KNOWN_CATEGORIES["Material"]:
            warnings.append(f"Unknown target material '{mat}'. Known: {list(KNOWN_CATEGORIES['Material'])}.")

        thick = data_dict.get("thickness", 0)
        if not isinstance(thick, (int, float)) or thick <= 0:
            warnings.append(f"Invalid target thickness '{thick} mm': Must be positive.")
            is_valid = False

        cal = data_dict.get("calibre", 0)
        if not isinstance(cal, (int, float)) or cal <= 0:
            warnings.append(f"Invalid calibre '{cal} mm': Must be positive.")
            is_valid = False

    return is_valid, warnings
