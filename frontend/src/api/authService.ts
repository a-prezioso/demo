// Simple Auth API client for the PWA
// - Uses fetch to call backend endpoints
// - Persists tokens via tokenStorage utilities
// - Never logs tokens or passwords

import { saveAuthTokens, AuthTokens, StoredUser } from '../utils/tokenStorage';

export interface LoginInput { email: string; password: string }
export interface SignupInput { email: string; password: string }

export interface AuthApiClient {
  login(input: LoginInput): Promise<{ accessToken: string; refreshToken: string; user: StoredUser }>
  signup(input: SignupInput): Promise<{ accessToken: string; refreshToken: string; user: StoredUser }>
}

const defaultBaseUrl = '';

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data.message === 'string') message = data.message;
    } catch {}
    const err = new Error(message) as any;
    (err.status = res.status);
    throw err;
  }
  return res.json() as Promise<T>;
}

export class AuthApiClientImpl implements AuthApiClient {
  constructor(private readonly baseUrl: string = defaultBaseUrl) {}

  async login(input: LoginInput) {
    const data = await postJson<{ accessToken: string; refreshToken: string; user: StoredUser }>(
      `${this.baseUrl}/api/auth/login`,
      { email: input.email, password: input.password },
    );
    // persist tokens
    const tokens: AuthTokens = { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user };
    saveAuthTokens(tokens);
    return data;
  }

  async signup(input: SignupInput) {
    const data = await postJson<{ accessToken: string; refreshToken: string; user: StoredUser }>(
      `${this.baseUrl}/api/auth/signup`,
      { email: input.email, password: input.password },
    );
    const tokens: AuthTokens = { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user };
    saveAuthTokens(tokens);
    return data;
  }
}

export const createAuthApiClient = (baseUrl?: string): AuthApiClient => new AuthApiClientImpl(baseUrl);
