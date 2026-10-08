"""
Domain Service
Computes 'Input Domain Coverage' (domain_score) measuring similarity of input parameters
to empirical training data feature distributions.

IMPORTANT:
This metric is strictly 'Input Domain Coverage'.
It measures proximity to training bounds and is NOT a probability of prediction correctness or confidence.
"""

import math
from typing import Dict, Any, Tuple

# Empirical min/max feature ranges extracted from training datasets
DATASET_FEATURE_BOUNDS = {
    "trajectory": {
        "velocity": (100.0, 1500.0),
        "angle_deg": (5.0, 85.0),
        "gravity": (8.0, 12.0)
    },
    "performance": {
        "Weight": (20.0, 750.0),
        "BC": (0.05, 0.90),
        "V0": (500.0, 4500.0)
    },
    "v50": {
        "calibre": (3.0, 30.0),
        "proj_mass": (0.5, 500.0),
        "thickness": (0.5, 100.0),
        "yield": (100.0, 2000.0),
        "UTS": (150.0, 2500.0),
        "angle": (0.0, 75.0)
    }
}

DOMAIN_EXPLANATION = (
    "Input Domain Coverage measures similarity to the training data and is not probability of correctness."
)

def calculate_domain_coverage(domain: str, input_dict: Dict[str, Any]) -> Tuple[float, str]:
    """
    Calculates Input Domain Coverage (domain_score) as a float between 0.0 and 1.0.
    1.0 indicates input features fall comfortably within empirical training dataset distributions.
    Values decrease smoothly as features deviate further outside the training domain bounds.
    """
    bounds = DATASET_FEATURE_BOUNDS.get(domain, {})
    if not bounds:
        return 0.85, DOMAIN_EXPLANATION

    score_sum = 0.0
    count = 0

    for feat, (min_val, max_val) in bounds.items():
        if feat in input_dict and isinstance(input_dict[feat], (int, float)):
            val = float(input_dict[feat])
            count += 1
            if min_val <= val <= max_val:
                # Within training bounds -> 1.0 coverage for this feature
                score_sum += 1.0
            else:
                # Calculate normalized distance penalty outside bounds
                span = max(1e-5, max_val - min_val)
                if val < min_val:
                    distance = (min_val - val) / span
                else:
                    distance = (val - max_val) / span
                
                # Exponential decay penalty
                feat_score = math.exp(-1.5 * distance)
                score_sum += max(0.0, feat_score)

    if count == 0:
        return 0.85, DOMAIN_EXPLANATION

    raw_score = score_sum / count
    domain_score = round(max(0.05, min(1.0, raw_score)), 3)

    return domain_score, DOMAIN_EXPLANATION
