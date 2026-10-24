import axios from 'axios';
import {
  HealthStatus,
  ModelMetadataItem,
  DatasetMetadataItem,
  DatasetSummary,
  TrajectoryInput,
  PerformanceInput,
  V50Input,
  PredictionResult,
  SimulationRequest,
  SimulationResponse,
  PaginatedDataResponse,
  PredictionHistoryItem
} from '../types';

/**
 * Resolves the API base URL from the VITE_API_URL environment variable.
 * Handles variations:
 * - With or without trailing slashes (e.g. 'https://ballastic-prediction.onrender.com/')
 * - With or without '/api' suffix (e.g. 'https://ballastic-prediction.onrender.com' vs '.../api')
 * - Falls back to '/api' for local development with the Vite proxy
 */
export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (!envUrl) {
    return '/api';
  }

  // Remove trailing slashes
  const cleanUrl = envUrl.replace(/\/+$/, '');

  // If already ends with /api, return as is; otherwise append /api
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // 1. GET /api/health
  getHealth: async (): Promise<HealthStatus> => {
    const res = await client.get<HealthStatus>('/health');
    return res.data;
  },

  // 2. GET /api/models
  getModels: async (): Promise<Record<string, ModelMetadataItem>> => {
    const res = await client.get<Record<string, ModelMetadataItem>>('/models');
    return res.data;
  },

  // 3. GET /api/datasets
  getDatasets: async (): Promise<DatasetMetadataItem[]> => {
    const res = await client.get<DatasetMetadataItem[]>('/datasets');
    return res.data;
  },

  // 4. GET /api/model/metrics
  getModelMetrics: async (): Promise<Record<string, any>> => {
    const res = await client.get<Record<string, any>>('/model/metrics');
    return res.data;
  },

  // 5. POST /api/predict/trajectory
  predictTrajectory: async (data: TrajectoryInput): Promise<PredictionResult> => {
    const res = await client.post<PredictionResult>('/predict/trajectory', data);
    return res.data;
  },

  // 6. POST /api/predict/performance
  predictPerformance: async (data: PerformanceInput): Promise<PredictionResult> => {
    const res = await client.post<PredictionResult>('/predict/performance', data);
    return res.data;
  },

  // 7. POST /api/predict/v50
  predictV50: async (data: V50Input): Promise<PredictionResult> => {
    const res = await client.post<PredictionResult>('/predict/v50', data);
    return res.data;
  },

  // 8. GET /api/dataset/summary/trajectory
  getTrajectorySummary: async (): Promise<DatasetSummary> => {
    const res = await client.get<DatasetSummary>('/dataset/summary/trajectory');
    return res.data;
  },

  // 9. GET /api/dataset/summary/performance
  getPerformanceSummary: async (): Promise<DatasetSummary> => {
    const res = await client.get<DatasetSummary>('/dataset/summary/performance');
    return res.data;
  },

  // 10. GET /api/dataset/summary/v50
  getV50Summary: async (): Promise<DatasetSummary> => {
    const res = await client.get<DatasetSummary>('/dataset/summary/v50');
    return res.data;
  },

  // Interactive Simulator Endpoint
  runSimulation: async (data: SimulationRequest): Promise<SimulationResponse> => {
    const res = await client.post<SimulationResponse>('/simulator/run', data);
    return res.data;
  },

  // Paginated dataset explorer records
  getDatasetData: async (
    datasetId: string,
    page: number = 1,
    pageSize: number = 50,
    search: string = ''
  ): Promise<PaginatedDataResponse> => {
    const res = await client.get<PaginatedDataResponse>(`/datasets/data/${datasetId}`, {
      params: { page, page_size: pageSize, search },
    });
    return res.data;
  },

  // History endpoints
  getHistory: async (): Promise<PredictionHistoryItem[]> => {
    const res = await client.get<PredictionHistoryItem[]>('/history');
    return res.data;
  },

  deleteHistoryItem: async (id: string): Promise<void> => {
    try {
      await client.delete(`/history/${encodeURIComponent(id)}`);
    } catch (e) {
      // Non-fatal if backend session already cleared
    }
  },

  clearHistory: async (): Promise<void> => {
    await client.delete('/history');
  }
};
