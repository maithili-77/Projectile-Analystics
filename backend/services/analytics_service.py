"""
Analytics Service
Computes and CACHES dataset summaries in memory at server startup.
Does not reload CSV files on every incoming request.
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

DATASET_PATHS = {
    "trajectory": [
        os.path.join(BASE_DIR, "data", "accurate_ballastic.csv"),
        os.path.join(BASE_DIR, "dataset", "accurate_ballastic.csv")
    ],
    "performance": [
        os.path.join(BASE_DIR, "data", "ballistics_500.csv"),
        os.path.join(BASE_DIR, "dataset", "ballistics_500.csv")
    ],
    "v50": [
        os.path.join(BASE_DIR, "data", "REL_v50_database_20230527.csv"),
        os.path.join(BASE_DIR, "dataset", "REL_v50_database_20230527.csv"),
        os.path.join(BASE_DIR, "dataset", "REL_v50_database_20230527(1).csv")
    ]
}

# In-Memory Cache
DATASET_SUMMARIES_CACHE: Dict[str, Dict[str, Any]] = {}
DATASETS_METADATA_CACHE: List[Dict[str, Any]] = []

def _resolve_file_path(paths: List[str]) -> str:
    for p in paths:
        if os.path.exists(p):
            return p
    return paths[0]

def cache_dataset_summaries():
    """Reads dataset CSV files ONCE on startup and caches summary statistics in memory."""
    global DATASET_SUMMARIES_CACHE, DATASETS_METADATA_CACHE
    print("[AnalyticsService] Computing and caching dataset summaries into memory...")

    summaries = {}
    metadata_list = []

    for key, possible_paths in DATASET_PATHS.items():
        filepath = _resolve_file_path(possible_paths)
        if not os.path.exists(filepath):
            print(f"[AnalyticsService] Warning: CSV dataset file not found at {filepath}")
            continue

        try:
            df = pd.read_csv(filepath)
            numeric_df = df.select_dtypes(include=[np.number])
            cat_df = df.select_dtypes(exclude=[np.number])

            missing_cells = int(df.isnull().sum().sum())
            row_count, col_count = df.shape

            # Compute numerical feature statistics (mean, std, min, 25%, 50%, 75%, max)
            stats = numeric_df.describe().round(3).to_dict()

            summary_obj = {
                "domain": key,
                "dataset_name": os.path.basename(filepath),
                "file_path": filepath,
                "total_rows": row_count,
                "total_columns": col_count,
                "columns": df.columns.tolist(),
                "numeric_columns": numeric_df.columns.tolist(),
                "categorical_columns": cat_df.columns.tolist(),
                "missing_cells": missing_cells,
                "feature_statistics": stats,
                "head_sample": df.head(5).replace({np.nan: None}).to_dict(orient="records")
            }

            summaries[key] = summary_obj
            metadata_list.append({
                "domain": key,
                "filename": os.path.basename(filepath),
                "rows": row_count,
                "columns": col_count,
                "missing_cells": missing_cells,
                "numeric_columns_count": len(numeric_df.columns),
                "categorical_columns_count": len(cat_df.columns)
            })
            print(f"[AnalyticsService] Cached summary for '{key}' ({row_count} rows, {col_count} columns)")
        except Exception as e:
            print(f"[AnalyticsService] Error processing CSV for {key}: {e}")

    DATASET_SUMMARIES_CACHE = summaries
    DATASETS_METADATA_CACHE = metadata_list

def get_dataset_summary(domain: str) -> Dict[str, Any]:
    """Retrieves cached summary for a domain ('trajectory', 'performance', 'v50')."""
    if not DATASET_SUMMARIES_CACHE:
        cache_dataset_summaries()
    return DATASET_SUMMARIES_CACHE.get(domain, {
        "domain": domain,
        "error": "Dataset summary not available in cache."
    })

def get_all_datasets_metadata() -> List[Dict[str, Any]]:
    """Retrieves list of all dataset metadata from cache."""
    if not DATASETS_METADATA_CACHE:
        cache_dataset_summaries()
    return DATASETS_METADATA_CACHE
