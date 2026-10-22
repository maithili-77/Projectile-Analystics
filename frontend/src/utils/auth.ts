import { UserProfile } from '../types';

export const BALLASTIX_AUTH_USER_KEY = 'ballastix_auth_user';
export const BALLASTIX_USERS_REGISTRY_KEY = 'ballastix_users_registry';

interface RegisteredAccount {
  profile: UserProfile;
  passwordHash: string;
}

export const DEMO_ACCOUNTS: Array<{ profile: UserProfile; password: string }> = [
  {
    profile: {
      id: 'usr_alex_vance',
      name: 'Dr. Alex Vance',
      email: 'alex.vance@ballastix.lab',
      role: 'Senior Ballistics Lead',
      avatarColor: 'from-cyan-500 to-blue-600',
      createdAt: '2026-01-15T08:00:00.000Z'
    },
    password: 'Password123!'
  },
  {
    profile: {
      id: 'usr_elena_rostova',
      name: 'Elena Rostova',
      email: 'elena.rostova@ballastix.lab',
      role: 'Armor Protection Specialist',
      avatarColor: 'from-purple-500 to-pink-600',
      createdAt: '2026-02-20T10:30:00.000Z'
    },
    password: 'Password123!'
  },
  {
    profile: {
      id: 'usr_marcus_thorne',
      name: 'Marcus Thorne',
      email: 'marcus.thorne@ballastix.lab',
      role: 'Computational Physicist',
      avatarColor: 'from-emerald-500 to-teal-600',
      createdAt: '2026-03-05T14:15:00.000Z'
    },
    password: 'Password123!'
  }
];

// Simple hash for client-side demo account verification
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}

/**
 * Get all registered accounts from localStorage, seeding with demo accounts if empty
 */
export function getRegisteredAccounts(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(BALLASTIX_USERS_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse user registry from localStorage:', e);
  }

  // Seed default demo accounts
  const initial: RegisteredAccount[] = DEMO_ACCOUNTS.map(demo => ({
    profile: demo.profile,
    passwordHash: simpleHash(demo.password)
  }));

  try {
    localStorage.setItem(BALLASTIX_USERS_REGISTRY_KEY, JSON.stringify(initial));
  } catch {}

  return initial;
}

/**
 * Get currently authenticated user profile
 */
export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(BALLASTIX_AUTH_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && user.email ? user : null;
  } catch {
    return null;
  }
}

/**
 * Set active user session
 */
export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(BALLASTIX_AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(BALLASTIX_AUTH_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to update active user in localStorage:', err);
  }
  window.dispatchEvent(new CustomEvent('ballastix_auth_changed', { detail: user }));
}

/**
 * Authenticate existing user with email and password
 */
export function loginUser(email: string, password: string): { success: boolean; user?: UserProfile; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  const accounts = getRegisteredAccounts();
  const found = accounts.find(acc => acc.profile.email.toLowerCase() === cleanEmail);

  if (!found) {
    return { success: false, error: 'No account found with this email address. Please sign up.' };
  }

  if (found.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  setCurrentUser(found.profile);
  return { success: true, user: found.profile };
}

/**
 * Register a new user account with distinct email
 */
export function signupUser(name: string, email: string, password: string, role: string = 'Ballistics Researcher'): { success: boolean; user?: UserProfile; error?: string } {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    return { success: false, error: 'Full name is required.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const accounts = getRegisteredAccounts();
  const exists = accounts.some(acc => acc.profile.email.toLowerCase() === cleanEmail);
  if (exists) {
    return { success: false, error: 'An account with this email address already exists. Please log in.' };
  }

  const palette = [
    'from-cyan-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-blue-500 to-cyan-600'
  ];
  const avatarColor = palette[Math.floor(Math.random() * palette.length)];

  const newProfile: UserProfile = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    email: cleanEmail,
    role: role || 'Ballistics Researcher',
    avatarColor,
    createdAt: new Date().toISOString()
  };

  const newAccount: RegisteredAccount = {
    profile: newProfile,
    passwordHash: simpleHash(password)
  };

  accounts.push(newAccount);
  try {
    localStorage.setItem(BALLASTIX_USERS_REGISTRY_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to persist user to registry:', err);
  }

  setCurrentUser(newProfile);
  return { success: true, user: newProfile };
}

/**
 * Sign out active user
 */
export function logoutUser(): void {
  setCurrentUser(null);
}
