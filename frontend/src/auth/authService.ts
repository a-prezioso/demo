// Auth service: integrates frontend forms with backend auth APIs and token storage
// Uses fetch via the thin client in src/api/authClient
// Handles storing tokens and exposing helpers for global usage.

import {
  login as apiLogin,
  signup as apiSignup,
  type LoginSuccessResponse,
  type SignupSuccessResponse,
  type ApiErrorResponse,
} from '../api/authClient';
import {
  clearAuthState,
  getAuthState,
  setAuthState,
  type StoredAuthState,
} from './tokenStorage';

export type AuthServiceOptions = {
  baseUrl?: string;
};

export async function login(
  email: string,
  password: string,
  options?: AuthServiceOptions,
): Promise<StoredAuthState> {
  try {
    const res: LoginSuccessResponse = await apiLogin({ email, password }, { baseUrl: options?.baseUrl });
    const next: StoredAuthState = {
      isAuthenticated: true,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    };
    setAuthState(next);
    return next;
  } catch (e: any) {
    // Re-throw preserving backend error details
    const status = e?.status as number | undefined;
    const payload: ApiErrorResponse | undefined = e?.payload;
    const err = new Error(payload?.error || 'auth.login_failed');
    (err as any).status = status;
    (err as any).details = payload?.details;
    throw err;
  }
}

export async function signup(
  email: string,
  password: string,
  options?: AuthServiceOptions,
): Promise<SignupSuccessResponse> {
  try {
    const res = await apiSignup({ email, password }, { baseUrl: options?.baseUrl });
    return res;
  } catch (e: any) {
    const status = e?.status as number | undefined;
    const payload: ApiErrorResponse | undefined = e?.payload;
    const err = new Error(payload?.error || 'auth.signup_failed');
    (err as any).status = status;
    (err as any).details = payload?.details;
    throw err;
  }
}

export function logout(): void {
  clearAuthState();
}

export function getCurrentAuth(): StoredAuthState {
  return getAuthState();
}
