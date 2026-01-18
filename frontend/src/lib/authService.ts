// authService - handles login/signup HTTP calls and token persistence
// IMPORTANT: never log plaintext passwords or token values

import { saveTokens } from './authToken';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshToken?: string;
  user: { id: string; email: string; status: string };
}

export interface SignupResponse {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthServiceConfig {
  apiBaseUrl?: string; // e.g., '' or '/'
}

async function postJson<T>(url: string, body: any): Promise<{ ok: boolean; status: number; json: any }>
{
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: { success: false, error: { message: 'network_error' } } } as any;
  }
}

function mapError(status: number, json: any): ApiError {
  if (json?.error) return json.error as ApiError;
  switch (status) {
    case 400:
      return { message: 'bad_request', code: 'BAD_REQUEST' };
    case 401:
      return { message: 'unauthorized', code: 'UNAUTHORIZED' };
    case 409:
      return { message: 'conflict', code: 'CONFLICT' };
    default:
      return { message: 'unknown_error', code: 'UNKNOWN' };
  }
}

export class AuthService {
  private base: string;
  constructor(cfg?: AuthServiceConfig) {
    this.base = (cfg?.apiBaseUrl ?? '').replace(/\/$/, '');
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const { ok, status, json } = await postJson<LoginResponse>(`${this.base}/api/auth/login`, { email, password });
    if (!ok || json?.success === false) {
      return { success: false, error: mapError(status, json) };
    }
    const data = json.data as LoginResponse;
    // persist tokens
    saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
    return { success: true, data };
  }

  async signup(email: string, password: string): Promise<ApiResponse<SignupResponse>> {
    const { ok, status, json } = await postJson<SignupResponse>(`${this.base}/api/auth/signup`, { email, password });
    if (!ok || json?.success === false) {
      return { success: false, error: mapError(status, json) };
    }
    return { success: true, data: json.data as SignupResponse };
  }
}

export default AuthService;
