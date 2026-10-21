import { PredictionHistoryItem } from '../types';

export const HISTORY_STORAGE_KEY = 'prediction_history';

/**
 * Retrieve all persisted prediction history items from browser localStorage
 */
export function getPredictionHistory(): PredictionHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read prediction history from localStorage:', err);
    return [];
  }
}

/**
 * Save a newly executed model prediction along with complete user inputs and model readings
 */
export function savePredictionToHistory(item: {
  type: 'Trajectory' | 'Performance' | 'V50' | string;
  model_name?: string;
  domain_score?: number;
  domain_coverage_explanation?: string;
  source_page?: string;
  input: Record<string, any>;
  output: Record<string, any>;
}): PredictionHistoryItem {
  const history = getPredictionHistory();
  const newItem: PredictionHistoryItem = {
    id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: item.type,
    timestamp: new Date().toISOString(),
    model_name: item.model_name || 'Machine Learning Pipeline',
    domain_score: item.domain_score !== undefined ? item.domain_score : 1.0,
    domain_coverage_explanation: item.domain_coverage_explanation,
    source_page: item.source_page || 'Model Predictor',
    input: { ...item.input },
    output: { ...item.output }
  };

  // Prepend so latest runs are at the top
  const updated = [newItem, ...history];
  // Limit to 100 items to avoid excessive storage
  const trimmed = updated.slice(0, 100);

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    // Dispatch custom event so any open history listener or tab can immediately re-render
    window.dispatchEvent(new Event('prediction_history_updated'));
  } catch (err) {
    console.error('Failed to save prediction history item:', err);
  }

  return newItem;
}

/**
 * Delete a single prediction item by ID or index
 */
export function deletePredictionHistoryItem(idOrIndex: string | number): PredictionHistoryItem[] {
  const history = getPredictionHistory();
  const updated = typeof idOrIndex === 'string'
    ? history.filter(item => item.id !== idOrIndex)
    : history.filter((_, idx) => idx !== idOrIndex);

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('prediction_history_updated'));
  } catch (err) {
    console.error('Failed to delete history item:', err);
  }

  return updated;
}

/**
 * Clear all saved prediction history
 */
export function clearPredictionHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    window.dispatchEvent(new Event('prediction_history_updated'));
  } catch (err) {
    console.error('Failed to clear prediction history:', err);
  }
}

/**
 * Populate standard academic sample runs if the user wants to test history immediately
 */
export function loadSamplePredictionHistory(): PredictionHistoryItem[] {
  const sampleItems: PredictionHistoryItem[] = [
    {
      id: `sample_traj_${Date.now()}`,
      type: 'Trajectory',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      model_name: 'Random Forest Regressor (range_model.pkl & height_model.pkl)',
      domain_score: 1.0,
      domain_coverage_explanation: 'All inputs fall within empirical training bounds (velocity: 600m/s, angle: 45°, gravity: 9.81m/s²).',
      source_page: 'Interactive Multi-Domain Simulator',
      input: {
        velocity: 600,
        angle_deg: 45,
        gravity: 9.81
      },
      output: {
        range_actual: 36697.24,
        max_height_actual: 9174.31
      }
    },
    {
      id: `sample_perf_${Date.now()}`,
      type: 'Performance',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      model_name: 'Random Forest Regressor (V100/V200 Pipeline)',
      domain_score: 1.0,
      domain_coverage_explanation: 'Input parameters match standard .308 WIN cartridge specifications.',
      source_page: 'Interactive Multi-Domain Simulator',
      input: {
        Cartridge: '.308 WINCHESTER',
        Type: 'Rifle',
        Weight: 150,
        BC: 0.45,
        V0: 2800,
        targets: ['V100', 'V200', 'E100', 'E200', 'BD100', 'BD200']
      },
      output: {
        V100: 2585.4,
        V200: 2381.1,
        E100: 2226.7,
        E200: 1888.5,
        BD100: 0.0,
        BD200: -3.8
      }
    },
    {
      id: `sample_v50_${Date.now()}`,
      type: 'V50',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      model_name: 'Random Forest ColumnTransformer',
      domain_score: 0.95,
      domain_coverage_explanation: 'Steel plate projectile impact simulation within REL V50 training distribution.',
      source_page: 'Interactive Multi-Domain Simulator',
      input: {
        proj_type: 'AP',
        calibre: 12.7,
        proj_mass: 45.0,
        proj_density: 7.85,
        proj_hardness: 60.0,
        Material: 'Steel',
        thickness: 10.0,
        density: 7.85,
        modulus: 210.0,
        hardness: 200.0,
        yield: 400.0,
        PR: 0.3,
        UTS: 600.0,
        elongation: 15.0,
        'Ludwik-n': 0.2,
        angle: 0.0
      },
      output: {
        v50: 785.4,
        predicted_v50: 785.4,
        kinetic_energy_at_v50: 13878.5
      }
    }
  ];

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sampleItems));
    window.dispatchEvent(new Event('prediction_history_updated'));
  } catch (err) {
    console.error('Failed to load sample history:', err);
  }
  return sampleItems;
}
