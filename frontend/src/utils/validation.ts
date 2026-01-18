// Client-side validation helpers mirroring backend rules (approximate)

export const isValidEmail = (email: string): boolean => {
  const e = email.trim().toLowerCase();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return EMAIL_REGEX.test(e);
};

export interface ClientPasswordValidation {
  valid: boolean;
  reasons: string[];
}

export const validatePasswordClient = (password: string): ClientPasswordValidation => {
  const reasons: string[] = [];
  const min = parseInt(process.env.PASSWORD_MIN_LENGTH || '10', 10);
  if (!password || password.length < min) reasons.push('min_length');
  if ((process.env.PASSWORD_REQUIRE_UPPERCASE || 'true') === 'true' && !/[A-Z]/.test(password)) reasons.push('uppercase');
  if ((process.env.PASSWORD_REQUIRE_LOWERCASE || 'true') === 'true' && !/[a-z]/.test(password)) reasons.push('lowercase');
  if ((process.env.PASSWORD_REQUIRE_DIGIT || 'true') === 'true' && !/\d/.test(password)) reasons.push('digit');
  if ((process.env.PASSWORD_REQUIRE_SPECIAL || 'true') === 'true' && !/[!@#$%^&*(),.?":{}|<>\[\]\-_=+;'/`~]/.test(password)) reasons.push('special');
  return { valid: reasons.length === 0, reasons };
};
