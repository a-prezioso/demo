import React, { useMemo, useState } from 'react';
import { LoginForm, LoginValues } from './LoginForm';
import { SignupForm, SignupValues } from './SignupForm';
import { defaultI18n, I18n, I18nDict } from '../../i18n/i18n';
import { useAuthOptional } from '../../auth/AuthContext';

export interface AuthApiClient {
  login(input: { email: string; password: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    refreshExpiresIn: number;
    user: { id: string; email: string; status: string };
  }>;
  signup(input: { email: string; password: string }): Promise<{
    id: string;
    email: string;
    status: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }>;
}

export interface AuthPageProps {
  api?: AuthApiClient; // allow DI for tests or custom clients
  onAuthSuccess?: (result: { accessToken: string; refreshToken: string; user: { id: string; email: string } }) => void;
  // Where to redirect after successful auth (login or signup). App can ignore if using onAuthSuccess
  redirectTo?: string;
  initialMode?: 'login' | 'signup';
  i18n?: Partial<I18nDict>;
  // optional navigation function (router-agnostic). If provided, will be used to navigate after success
  navigate?: (to: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ api, onAuthSuccess, redirectTo = '/app', initialMode = 'login', i18n, navigate }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const dict = useMemo<I18n>(() => defaultI18n(i18n), [i18n]);
  const auth = useAuthOptional();

  const afterAuth = (res: { accessToken: string; refreshToken: string; user: { id: string; email: string } }) => {
    // If AuthContext is present, persist in context as well to keep app state in sync
    if (auth) auth.setAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
    onAuthSuccess?.(res);
    if (navigate) navigate(redirectTo);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.tabs}>
          <button
            type="button"
            aria-pressed={mode === 'login'}
            onClick={() => setMode('login')}
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : undefined) }}
          >
            {dict.t('auth.loginTab')}
          </button>
          <button
            type="button"
            aria-pressed={mode === 'signup'}
            onClick={() => setMode('signup')}
            style={{ ...styles.tab, ...(mode === 'signup' ? styles.tabActive : undefined) }}
          >
            {dict.t('auth.signupTab')}
          </button>
        </div>

        {mode === 'login' ? (
          <LoginForm
            i18n={dict}
            onSubmit={async (values: LoginValues) => {
              const client = api ?? defaultApiClient;
              const res = await client.login(values);
              afterAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
            }}
          />
        ) : (
          <SignupForm
            i18n={dict}
            onSubmit={async (values: SignupValues) => {
              const client = api ?? defaultApiClient;
              // perform signup then auto-login for convenience
              await client.signup({ email: values.email, password: values.password });
              const res = await client.login({ email: values.email, password: values.password });
              afterAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
              setMode('login');
            }}
          />
        )}
      </div>
    </div>
  );
};

// Default basic API client; in apps, wrap with fetch polyfills as needed
const defaultApiClient: AuthApiClient = {
  async login(input) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || 'login_failed');
    }
    return res.json();
  },
  async signup(input) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || 'signup_failed');
    }
    return res.json();
  },
};

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f7fb',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    padding: 24,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    cursor: 'pointer',
    fontWeight: 600,
  },
  tabActive: {
    background: '#111827',
    color: '#fff',
    borderColor: '#111827',
  },
};

export default AuthPage;
