import {
  UserAccount,
  TeamData,
  TransferListing,
  ChampionPvPStats,
  PlayerData
} from '../types';

export const SESSION_TOKEN_KEY = 'espician_session_token';

export interface ClubStatePayload {
  currentDay: number;
  myTeam: TeamData;
  marketListings: TransferListing[];
  championPvPStats: Record<string, ChampionPvPStats>;
  pendingStarterSquad: PlayerData[];
  isTutorialCompleted?: boolean;
  accountLevel?: number;
  accountExp?: number;
}

export interface AuthSuccessResponse {
  token: string;
  user: UserAccount;
  clubState: ClubStatePayload | null;
}

export interface DbStatusResponse {
  status: string;
  engine: string;
  dbFile: string;
  totalUsers: number;
  totalMatches: number;
}

function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:3001`;
}

export function getSavedSessionToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setSavedSessionToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSavedSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch {
    throw new Error(
      'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ฐานข้อมูล SQLite (พอร์ต 3001) ได้ กรุณาตรวจสอบว่า npm run server กำลังทำงานอยู่'
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP Error ${response.status}`);
  }
  return data as T;
}

export const ApiService = {
  async getDbStatus(): Promise<DbStatusResponse> {
    return apiRequest<DbStatusResponse>('/api/db/status', { method: 'GET' });
  },

  async register(params: {
    username: string;
    email: string;
    password: string;
    initialClubState: ClubStatePayload;
  }): Promise<AuthSuccessResponse> {
    const res = await apiRequest<AuthSuccessResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    setSavedSessionToken(res.token);
    return res;
  },

  async login(params: {
    identifier: string;
    password: string;
  }): Promise<AuthSuccessResponse> {
    const res = await apiRequest<AuthSuccessResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    setSavedSessionToken(res.token);
    return res;
  },

  async googleAuth(params: {
    accessToken?: string;
    idToken?: string;
    initialClubState: ClubStatePayload;
  }): Promise<AuthSuccessResponse> {
    const res = await apiRequest<AuthSuccessResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    setSavedSessionToken(res.token);
    return res;
  },

  async getGoogleAuthorizationUrl(params?: {
    clientId?: string;
    redirectUri?: string;
  }): Promise<{ url: string; redirectUri: string; hasClientSecretConfigured: boolean }> {
    const query = new URLSearchParams();
    if (params?.clientId) query.set('client_id', params.clientId);
    if (params?.redirectUri) query.set('redirect_uri', params.redirectUri);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{ url: string; redirectUri: string; hasClientSecretConfigured: boolean }>(
      `/api/auth/google/url${qs}`,
      { method: 'GET' }
    );
  },

  async exchangeGoogleCode(params: {
    code: string;
    initialClubState: ClubStatePayload;
  }): Promise<AuthSuccessResponse> {
    const res = await apiRequest<AuthSuccessResponse>('/api/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    setSavedSessionToken(res.token);
    return res;
  },

  async fetchMe(): Promise<{ user: UserAccount; clubState: ClubStatePayload | null }> {
    return apiRequest<{ user: UserAccount; clubState: ClubStatePayload | null }>(
      '/api/auth/me',
      { method: 'GET' }
    );
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setSavedSessionToken(null);
    }
  },

  async saveClubState(payload: ClubStatePayload): Promise<void> {
    if (!getSavedSessionToken()) return;
    try {
      await apiRequest('/api/club/state', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('[SQLite Sync] Could not auto-save club state:', err);
    }
  },

  async recordMatch(params: {
    winner: 'blue' | 'red';
    prize: number;
    repGain: number;
    day: number;
  }): Promise<void> {
    if (!getSavedSessionToken()) return;
    try {
      await apiRequest('/api/club/match-history', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    } catch (err) {
      console.warn('[SQLite Sync] Could not record match history:', err);
    }
  },

  async getFishingState(): Promise<any | null> {
    if (!getSavedSessionToken()) return null;
    try {
      const res = await apiRequest<{ state: any | null }>('/api/fishing/state');
      return res.state;
    } catch {
      return null;
    }
  },

  async saveFishingState(state: any): Promise<void> {
    if (!getSavedSessionToken()) return;
    try {
      await apiRequest('/api/fishing/state', {
        method: 'PUT',
        body: JSON.stringify({ state })
      });
    } catch {
      // Ignore network sync errors silently
    }
  }
};
