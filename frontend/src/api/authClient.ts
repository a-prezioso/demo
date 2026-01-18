// Lightweight API client for auth endpoints
// Provides login and signup helpers compatible with backend responses

export interface PublicUser {
  id: string;
  email: string;
  status?: string;
}

export interface LoginSuccessResponse {
  accessToken: string;
  accessTokenExpiresAt: string; // ISO
  refreshToken: string;
  refreshTokenExpiresAt: string; // ISO
  tokenType: 'Bearer' | string;
  user: PublicUser;
}

export interface SignupSuccessResponse {
  user: PublicUser;
}

export interface ApiErrorResponse {
  error: string;
  details?: any;
}

export type AuthClientOptions = {
  baseUrl?: string; // e.g., '/api'
  fetchImpl?: typeof fetch; // allow injection for tests
  headers?: Record<string, string>;
};

function buildUrl(baseUrl: string | undefined, path: string): string {
  const base = baseUrl || '';
  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function postJson<T>(url: string, body: any, opts?: AuthClientOptions): Promise<T> {
  const f = opts?.fetchImpl || fetch;
  const res = await f(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers || {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const err: ApiErrorResponse = (isJson ? data : { error: String(data) }) as any;
    throw Object.assign(new Error('Request failed'), { status: res.status, payload: err });
  }
  return data as T;
}

export async function login(
  params: { email: string; password: string },
  options?: AuthClientOptions,
): Promise<LoginSuccessResponse> {
  const url = buildUrl(options?.baseUrl, '/auth/login');
  return postJson<LoginSuccessResponse>(url, params, options);
}

export async function signup(
  params: { email: string; password: string },
  options?: AuthClientOptions,
): Promise<SignupSuccessResponse> {
  const url = buildUrl(options?.baseUrl, '/auth/signup');
  return postJson<SignupSuccessResponse>(url, params, options);
}
