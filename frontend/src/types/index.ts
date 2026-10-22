export interface HealthStatus {
  status: string;
  academic_notice: string;
  models_loaded: string;
  registry: Record<string, ModelMetadataItem>;
}

export interface ModelMetadataItem {
  model_id: string;
  model_name: string;
  domain: string;
  target: string;
  model_type: string;
  expected_num_features: number;
  feature_names: string[];
  scaler?: string | null;
  encoder?: string | null;
  preprocessor?: string | null;
  model_metrics?: Record<string, any>;
  loaded: boolean;
  file_path: string;
  error?: string | null;
}

export interface DatasetMetadataItem {
  domain: string;
  filename: string;
  rows: number;
  columns: number;
  missing_cells: number;
  numeric_columns_count: number;
  categorical_columns_count: number;
}

export interface DatasetSummary {
  domain: string;
  dataset_name: string;
  file_path: string;
  total_rows: number;
  total_columns: number;
  columns: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  missing_cells: number;
  feature_statistics: Record<string, Record<string, number>>;
  head_sample: Record<string, any>[];
}

export interface TrajectoryInput {
  velocity: number;
  angle_deg: number;
  gravity: number;
}

export interface TrajectoryPrediction {
  velocity: number;
  angle_deg: number;
  gravity: number;
  predicted_range: number;
  predicted_max_height: number;
  theoretical_range: number;
  theoretical_max_height: number;
  flight_time: number;
  model_used: string;
}

export interface PerformanceInput {
  Cartridge: string;
  Type: string;
  Weight: number;
  BC: number;
  V0: number;
  targets?: string[];
}

export interface BallisticInput {
  Cartridge: string;
  Type: string;
  Weight: number;
  BC: number;
  V0: number;
}

export interface BallisticPrediction {
  Cartridge: string;
  Type: string;
  Weight: number;
  BC: number;
  V0: number;
  V100: number;
  V200: number;
  E0: number;
  E100: number;
  E200: number;
  BD100: number;
  BD200: number;
  model_used: string;
}

export interface V50Input {
  proj_type: string;
  calibre: number;
  proj_mass: number;
  proj_density: number;
  proj_hardness: number;
  Material: string;
  thickness: number;
  density: number;
  modulus: number;
  hardness: number;
  yield: number;
  PR: number;
  UTS: number;
  elongation: number;
  'Ludwik-n': number;
  angle: number;
}

export interface V50Prediction {
  predicted_v50: number;
  kinetic_energy_at_v50: number;
  impact_energy_joules: number;
  penetration_probability_at_v50: number;
  model_used: string;
}

export interface PredictionResult {
  prediction: Record<string, any>;
  model_name: string;
  input_valid: boolean;
  domain_score: number;
  domain_coverage_explanation: string;
  warnings: string[];
  metrics?: Record<string, any>;
  feature_importances?: { feature: string; importance: number }[];
}


export interface SimulationRequest {
  velocity: number;
  angle_deg: number;
  gravity: number;
  mass_kg: number;
  drag_coeff: number;
  num_points: number;
}

export interface TrajectoryPoint {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  v: number;
}

export interface SimulationResponse {
  points: TrajectoryPoint[];
  max_range: number;
  max_height: number;
  total_flight_time: number;
  apex_time: number;
  input_params: SimulationRequest;
}

export interface PaginatedDataResponse {
  dataset_id: string;
  total_records: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: Record<string, any>[];
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface ModelPerformanceMetric {
  model: string;
  mae: number;
  rmse: number;
  r2: number;
  selected: boolean;
}

export interface AnalyticsInsights {
  models: {
    trajectory: ModelPerformanceMetric[];
    v100_cartridge: ModelPerformanceMetric[];
    v50_penetration: ModelPerformanceMetric[];
  };
  feature_importances: {
    trajectory: FeatureImportanceItem[];
    v100_cartridge: FeatureImportanceItem[];
    v50_penetration: FeatureImportanceItem[];
  };
  correlations: Record<string, {
    columns: string[];
    values: number[][];
  }>;
  datasets: DatasetSummary[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarColor?: string;
  createdAt: string;
}

export interface PredictionHistoryItem {
  id?: string;
  type: string;
  timestamp: string;
  model_name?: string;
  domain_score?: number;
  domain_coverage_explanation?: string;
  source_page?: string;
  input: Record<string, any>;
  output: Record<string, any>;
  user_email?: string;
  user_name?: string;
}

