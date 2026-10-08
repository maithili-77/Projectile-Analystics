from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DatasetSummary(BaseModel):
    id: str
    name: str
    filename: str
    rows: int
    columns: int
    column_names: List[str]
    missing_cells: int
    numeric_columns: List[str]
    categorical_columns: List[str]

class AnalyticsInsights(BaseModel):
    models: Dict[str, Any]
    datasets: List[DatasetSummary]
    feature_importances: Dict[str, List[Dict[str, Any]]]

class PaginatedDataResponse(BaseModel):
    dataset_id: str
    total_records: int
    page: int
    page_size: int
    total_pages: int
    records: List[Dict[str, Any]]
