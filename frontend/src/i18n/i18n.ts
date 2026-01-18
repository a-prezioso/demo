export interface I18nDict {
  [k: string]: any;
}

export interface I18n {
  t: (key: string) => string;
}

const en: I18nDict = {
  'auth.loginTab': 'Login',
  'auth.signupTab': 'Sign up',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm password',
  'auth.login': 'Login',
  'auth.signup': 'Create account',
  'auth.loading': 'Please wait…',
  'auth.passwordHint': 'Password must be at least 10 characters and include upper, lower, digit and special character.',
  'auth.placeholders.email': 'you@example.com',
  'auth.placeholders.password': 'Your password',
  'auth.placeholders.confirmPassword': 'Repeat your password',
  'auth.errors.required': 'This field is required',
  'auth.errors.invalidEmail': 'Please enter a valid email address',
  'auth.errors.passwordMismatch': 'Passwords do not match',
  'auth.errors.passwordPolicy': 'Password does not meet security requirements',
  'auth.showPassword': 'Show password',
  'auth.hidePassword': 'Hide password',
  // Backend error mappings
  'auth.backend.invalid_input': 'Invalid input. Check your data and try again.',
  'auth.backend.invalid_credentials': 'Email or password is incorrect.',
  'auth.backend.account_disabled': 'Your account is disabled. Contact support.',
  'auth.backend.account_unverified': 'Your account is not verified yet.',
  'auth.backend.account_suspended': 'Your account is suspended.',
  'auth.backend.Email already registered': 'This email is already registered.',
  'auth.backend.signup_failed': 'Signup failed. Please try again later.',
  'auth.backend.login_failed': 'Login failed. Please try again later.',
  'auth.backend.Internal server error': 'Unexpected server error. Please try again.',
};

const it: I18nDict = {
  'auth.loginTab': 'Accedi',
  'auth.signupTab': 'Registrati',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Conferma password',
  'auth.login': 'Accedi',
  'auth.signup': 'Crea account',
  'auth.loading': 'Attendere…',
  'auth.passwordHint': 'La password deve avere almeno 10 caratteri, includere maiuscole, minuscole, numeri e un carattere speciale.',
  'auth.placeholders.email': 'tu@esempio.com',
  'auth.placeholders.password': 'La tua password',
  'auth.placeholders.confirmPassword': 'Ripeti la password',
  'auth.errors.required': 'Campo obbligatorio',
  'auth.errors.invalidEmail': 'Inserisci un indirizzo email valido',
  'auth.errors.passwordMismatch': 'Le password non coincidono',
  'auth.errors.passwordPolicy': 'La password non rispetta i requisiti di sicurezza',
  'auth.showPassword': 'Mostra password',
  'auth.hidePassword': 'Nascondi password',
  'auth.backend.invalid_input': 'Input non valido. Controlla i dati e riprova.',
  'auth.backend.invalid_credentials': 'Email o password non corretti.',
  'auth.backend.account_disabled': 'Il tuo account è disabilitato. Contatta il supporto.',
  'auth.backend.account_unverified': 'Il tuo account non è ancora verificato.',
  'auth.backend.account_suspended': "Il tuo account è sospeso.",
  'auth.backend.Email already registered': "Questa email risulta già registrata.",
  'auth.backend.signup_failed': 'Registrazione non riuscita. Riprova più tardi.',
  'auth.backend.login_failed': 'Accesso non riuscito. Riprova più tardi.',
  'auth.backend.Internal server error': 'Errore imprevisto del server. Riprova.',
};

export function defaultI18n(override?: Partial<I18nDict>, locale: 'en' | 'it' = 'it'): I18n {
  const base = locale === 'it' ? it : en;
  const dict = { ...base, ...(override || {}) };
  return { t: (key: string) => dict[key] ?? key };
}

export const dictionaries = { en, it };
