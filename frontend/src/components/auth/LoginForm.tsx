import React, { useMemo, useState } from 'react';
import { I18n, I18nDict, defaultI18n } from '../../i18n/i18n';
import { isValidEmail } from '../../utils/validation';

export interface LoginValues {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onSubmit: (values: LoginValues) => Promise<void> | void;
  i18n?: I18n | Partial<I18nDict>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, i18n }) => {
  const dict = useMemo<I18n>(() => (isI18n(i18n) ? (i18n as I18n) : defaultI18n(i18n as Partial<I18nDict> | undefined)), [i18n]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!isValidEmail(email)) e.email = dict.t('auth.errors.invalidEmail');
    if (!password) e.password = dict.t('auth.errors.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrors({});
    if (!validate()) return;
    try {
      setLoading(true);
      await onSubmit({ email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      const message = normalizeBackendError(err?.message);
      setErrors({ form: dict.t(`auth.backend.${message}`) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>{dict.t('auth.email')}</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={dict.t('auth.placeholders.email')}
          style={styles.input}
        />
        {errors.email && <div style={styles.error}>{errors.email}</div>}
      </div>

      <div style={styles.field}>
        <label htmlFor="password" style={styles.label}>{dict.t('auth.password')}</label>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={dict.t('auth.placeholders.password')}
            style={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            aria-label={showPassword ? dict.t('auth.hidePassword') : dict.t('auth.showPassword')}
            style={styles.eyeButton}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.password && <div style={styles.error}>{errors.password}</div>}
      </div>

      {errors.form && <div style={{ ...styles.error, marginBottom: 8 }}>{errors.form}</div>}

      <button type="submit" disabled={loading} style={{ ...styles.submit, opacity: loading ? 0.7 : 1 }}>
        {loading ? dict.t('auth.loading') : dict.t('auth.login')}
      </button>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontWeight: 600, marginBottom: 6 },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    outline: 'none',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 16,
  },
  error: { color: '#b91c1c', fontSize: 12, marginTop: 6 },
  submit: {
    marginTop: 8,
    background: '#111827',
    color: '#fff',
    padding: '10px 12px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
};

function isI18n(x: any): x is I18n {
  return !!x && typeof (x as I18n).t === 'function';
}

function normalizeBackendError(msg?: string): string {
  const known = new Set([
    'invalid_input',
    'invalid_credentials',
    'account_disabled',
    'account_unverified',
    'account_suspended',
    'Email already registered',
    'Internal server error',
    'signup_failed',
    'login_failed',
  ]);
  if (!msg) return 'login_failed';
  if (known.has(msg)) return msg;
  // map backend phrases to keys
  if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('already')) return 'Email already registered';
  if (msg.toLowerCase().includes('credential')) return 'invalid_credentials';
  return 'login_failed';
}

export default LoginForm;
