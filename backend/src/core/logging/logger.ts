// Basic logger placeholder ensuring sensitive data are never logged.
// Replace with a proper logger like pino/winston in the future.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const redact = (msg: unknown): unknown => {
  if (typeof msg === 'string') {
    // naive redaction: do not allow common sensitive keywords
    return msg
      .replace(/password/gi, '***')
      .replace(/hash/gi, '***')
      .replace(/salt/gi, '***')
      .replace(/token/gi, '***');
  }
  if (typeof msg === 'object' && msg !== null) {
    const clone: any = Array.isArray(msg) ? [] : {};
    for (const [k, v] of Object.entries(msg as any)) {
      if (/(password|hash|salt|token)/i.test(k)) {
        clone[k] = '***';
      } else {
        clone[k] = v;
      }
    }
    return clone;
  }
  return msg;
};

const log = (level: LogLevel, ...args: any[]) => {
  const safeArgs = args.map(redact);
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](...safeArgs);
};

export const logger = {
  debug: (...args: any[]) => log('debug', ...args),
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
};
