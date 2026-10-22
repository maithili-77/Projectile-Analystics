import { PredictionHistoryItem } from '../types';
import { getCurrentUser } from './auth';

export const LEGACY_HISTORY_STORAGE_KEY = 'prediction_history';
export const HISTORY_USERS_INDEX_KEY = 'ballastix_history_users_index';

/**
 * Computes a sanitized, unique localStorage key for a specific user email
 */
export function getUserHistoryKey(email?: string): string {
  const current = getCurrentUser();
  const targetEmail = (email || current?.email || 'guest@ballastix.lab').trim().toLowerCase();
  const sanitized = targetEmail.replace(/[^a-zA-Z0-9_]/g, '_');
  return `ballastix_history_${sanitized}`;
}

/**
 * Register a user email in the global history index
 */
function recordUserInHistoryIndex(email: string, name?: string): void {
  try {
    const raw = localStorage.getItem(HISTORY_USERS_INDEX_KEY);
    const index: Record<string, { email: string; name: string; lastUpdated: string }> = raw ? JSON.parse(raw) : {};
    const cleanEmail = email.trim().toLowerCase();
    index[cleanEmail] = {
      email: cleanEmail,
      name: name || index[cleanEmail]?.name || cleanEmail.split('@')[0],
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(HISTORY_USERS_INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    console.warn('Failed to record user in history index:', e);
  }
}

/**
 * Returns all user accounts that currently have saved prediction history
 */
export function getHistoryUserAccounts(): Array<{ email: string; name: string; count: number }> {
  try {
    const raw = localStorage.getItem(HISTORY_USERS_INDEX_KEY);
    const index: Record<string, { email: string; name: string }> = raw ? JSON.parse(raw) : {};
    const result: Array<{ email: string; name: string; count: number }> = [];

    const currentUser = getCurrentUser();
    if (currentUser?.email && !index[currentUser.email.toLowerCase()]) {
      index[currentUser.email.toLowerCase()] = {
        email: currentUser.email.toLowerCase(),
        name: currentUser.name
      };
    }

    for (const [email, info] of Object.entries(index)) {
      const storageKey = getUserHistoryKey(email);
      const itemsRaw = localStorage.getItem(storageKey);
      const count = itemsRaw ? (JSON.parse(itemsRaw) || []).length : 0;
      result.push({
        email: info.email,
        name: info.name || email.split('@')[0],
        count
      });
    }

    return result;
  } catch {
    return [];
  }
}

/**
 * Retrieve all persisted prediction history items for the given email (or currently active user)
 */
export function getPredictionHistory(email?: string): PredictionHistoryItem[] {
  try {
    const storageKey = getUserHistoryKey(email);
    const raw = localStorage.getItem(storageKey);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Fallback migration: check if legacy unscoped history exists for first migration
    const legacyRaw = localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
    if (legacyRaw && !email) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
        const currentUser = getCurrentUser();
        const userEmail = currentUser?.email?.toLowerCase() || 'guest@ballastix.lab';
        const userName = currentUser?.name || 'Guest Researcher';
        const migrated = legacyParsed.map(item => ({
          ...item,
          user_email: item.user_email || userEmail,
          user_name: item.user_name || userName
        }));
        localStorage.setItem(storageKey, JSON.stringify(migrated));
        recordUserInHistoryIndex(userEmail, userName);
        return migrated;
      }
    }

    return [];
  } catch (err) {
    console.error('Failed to read prediction history from localStorage:', err);
    return [];
  }
}

/**
 * Save a newly executed model prediction to the active user's dedicated history log
 */
export function savePredictionToHistory(item: {
  type: 'Trajectory' | 'Performance' | 'V50' | string;
  model_name?: string;
  domain_score?: number;
  domain_coverage_explanation?: string;
  source_page?: string;
  input: Record<string, any>;
  output: Record<string, any>;
  user_email?: string;
  user_name?: string;
}, overrideEmail?: string): PredictionHistoryItem {
  const currentUser = getCurrentUser();
  const activeEmail = (overrideEmail || item.user_email || currentUser?.email || 'guest@ballastix.lab').trim().toLowerCase();
  const activeName = item.user_name || currentUser?.name || activeEmail.split('@')[0];

  const storageKey = getUserHistoryKey(activeEmail);
  const history = getPredictionHistory(activeEmail);

  const newItem: PredictionHistoryItem = {
    id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: item.type,
    timestamp: new Date().toISOString(),
    model_name: item.model_name || 'Machine Learning Pipeline',
    domain_score: item.domain_score !== undefined ? item.domain_score : 1.0,
    domain_coverage_explanation: item.domain_coverage_explanation,
    source_page: item.source_page || 'Model Predictor',
    input: { ...item.input },
    output: { ...item.output },
    user_email: activeEmail,
    user_name: activeName
  };

  // Prepend so latest runs are at the top
  const updated = [newItem, ...history];
  // Limit to 150 items per user to avoid excessive storage
  const trimmed = updated.slice(0, 150);

  try {
    localStorage.setItem(storageKey, JSON.stringify(trimmed));
    recordUserInHistoryIndex(activeEmail, activeName);
    // Dispatch custom event so any open history listener or tab can immediately re-render
    window.dispatchEvent(new CustomEvent('prediction_history_updated', {
      detail: { email: activeEmail, item: newItem }
    }));
  } catch (err) {
    console.error('Failed to save prediction history item:', err);
  }

  return newItem;
}

/**
 * Delete a single prediction item by ID, index, or item object from user storage and all local logs
 */
export function deletePredictionHistoryItem(
  target: string | number | { id?: string; timestamp?: string; user_email?: string },
  email?: string
): PredictionHistoryItem[] {
  const targetId = typeof target === 'string'
    ? target
    : typeof target === 'object'
    ? target?.id
    : undefined;

  const targetTimestamp = typeof target === 'object' ? target?.timestamp : undefined;
  const targetIndex = typeof target === 'number' ? target : undefined;

  const targetEmail = (
    (typeof target === 'object' && target?.user_email) ||
    (email && email !== 'ALL' ? email : getCurrentUser()?.email || 'guest@ballastix.lab')
  ).trim().toLowerCase();

  const filterItem = (item: PredictionHistoryItem, idx: number) => {
    if (targetId && item.id) {
      return item.id !== targetId;
    }
    if (targetTimestamp && item.timestamp) {
      return item.timestamp !== targetTimestamp;
    }
    if (targetIndex !== undefined) {
      return idx !== targetIndex;
    }
    return true;
  };

  // 1. Delete from targeted email storage
  const primaryKey = getUserHistoryKey(targetEmail);
  const currentItems = getPredictionHistory(targetEmail);
  const updatedPrimary = currentItems.filter(filterItem);
  try {
    localStorage.setItem(primaryKey, JSON.stringify(updatedPrimary));
  } catch (err) {
    console.error('Failed to update primary history:', err);
  }

  // 2. Also check across all registered accounts so deleting works in 'ALL' combined view
  try {
    const raw = localStorage.getItem(HISTORY_USERS_INDEX_KEY);
    const index: Record<string, any> = raw ? JSON.parse(raw) : {};
    for (const uEmail of Object.keys(index)) {
      if (uEmail.toLowerCase() === targetEmail.toLowerCase()) continue;
      const key = getUserHistoryKey(uEmail);
      const itemsRaw = localStorage.getItem(key);
      if (itemsRaw) {
        const items = JSON.parse(itemsRaw);
        if (Array.isArray(items)) {
          const filtered = items.filter(filterItem);
          if (filtered.length !== items.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      }
    }
  } catch (e) {
    console.warn('Cross-account delete scan warning:', e);
  }

  // 3. Also check legacy unscoped key if present
  try {
    const legacyRaw = localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
    if (legacyRaw) {
      const items = JSON.parse(legacyRaw);
      if (Array.isArray(items)) {
        const filtered = items.filter(filterItem);
        localStorage.setItem(LEGACY_HISTORY_STORAGE_KEY, JSON.stringify(filtered));
      }
    }
  } catch (e) {}

  // 4. Mark deletion so loadHistory does not re-fetch deleted records from backend
  try {
    sessionStorage.setItem('ballastix_history_user_deleted', 'true');
  } catch {}

  window.dispatchEvent(new CustomEvent('prediction_history_updated', {
    detail: { email: targetEmail, deletedId: targetId }
  }));

  return updatedPrimary;
}

/**
 * Clear all saved prediction history for the specified user (or active user)
 */
export function clearPredictionHistory(email?: string): void {
  const activeEmail = (email || getCurrentUser()?.email || 'guest@ballastix.lab').trim().toLowerCase();

  if (activeEmail === 'all') {
    try {
      const raw = localStorage.getItem(HISTORY_USERS_INDEX_KEY);
      const index: Record<string, any> = raw ? JSON.parse(raw) : {};
      for (const u of Object.keys(index)) {
        localStorage.removeItem(getUserHistoryKey(u));
      }
      localStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
    } catch {}
  } else {
    const storageKey = getUserHistoryKey(activeEmail);
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear prediction history:', err);
    }
  }

  try {
    sessionStorage.setItem('ballastix_history_user_deleted', 'true');
  } catch {}

  window.dispatchEvent(new CustomEvent('prediction_history_updated', { detail: { email: activeEmail } }));
}

/**
 * Populate standard academic sample runs for the specified user
 */
export function loadSamplePredictionHistory(email?: string): PredictionHistoryItem[] {
  const currentUser = getCurrentUser();
  const activeEmail = (email || currentUser?.email || 'guest@ballastix.lab').trim().toLowerCase();
  const activeName = currentUser?.name || activeEmail.split('@')[0];
  const storageKey = getUserHistoryKey(activeEmail);

  const sampleItems: PredictionHistoryItem[] = [
    {
      id: `sample_traj_${Date.now()}`,
      type: 'Trajectory',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      model_name: 'Random Forest Regressor (range_model.pkl & height_model.pkl)',
      domain_score: 1.0,
      domain_coverage_explanation: 'All inputs fall within empirical training bounds (velocity: 600m/s, angle: 45°, gravity: 9.81m/s²).',
      source_page: 'Interactive Multi-Domain Simulator',
      user_email: activeEmail,
      user_name: activeName,
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
      user_email: activeEmail,
      user_name: activeName,
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
      user_email: activeEmail,
      user_name: activeName,
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
    localStorage.setItem(storageKey, JSON.stringify(sampleItems));
    recordUserInHistoryIndex(activeEmail, activeName);
    window.dispatchEvent(new CustomEvent('prediction_history_updated', { detail: { email: activeEmail } }));
  } catch (err) {
    console.error('Failed to load sample history:', err);
  }
  return sampleItems;
}
