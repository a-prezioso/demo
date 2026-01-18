// passwordHasher - centralizes password hashing policy.
// This is a placeholder; actual implementation will use bcrypt or argon2.
// Never log raw password, hash, or salt.

export interface PasswordHasher {
  hash(plain: string): Promise<{ hash: string; salt?: string | null }>;
  verify(plain: string, hash: string, salt?: string | null): Promise<boolean>;
}

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<{ hash: string; salt?: string | null }> {
    // TODO: implement with bcrypt; bcrypt embeds salt in hash string
    // return { hash: await bcrypt.hash(plain, 12) };
    return { hash: `__hash_placeholder__:${plain.length}` };
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    // TODO: implement with bcrypt.compare(plain, hash)
    return hash.startsWith('__hash_placeholder__:') && hash.endsWith(String(plain.length));
  }
}

// Scrypt-based hasher using Node's crypto module (no external deps)
// Hash format: scrypt:N=<N>,r=<r>,p=<p>,keylen=<keylen>$<salt_b64>$<hash_b64>
// Note: salt is also returned separately for storage when schema expects it.
export class ScryptPasswordHasher implements PasswordHasher {
  private readonly N: number;
  private readonly r: number;
  private readonly p: number;
  private readonly keylen: number;

  constructor(params?: { N?: number; r?: number; p?: number; keylen?: number }) {
    const envN = parseInt(process.env.SCRYPT_N || '', 10);
    const envR = parseInt(process.env.SCRYPT_r || '', 10);
    const envP = parseInt(process.env.SCRYPT_p || '', 10);
    const envKeylen = parseInt(process.env.SCRYPT_KEYLEN || '', 10);

    this.N = params?.N ?? (Number.isFinite(envN) && envN > 1 ? envN : 16384); // 2^14
    this.r = params?.r ?? (Number.isFinite(envR) && envR > 0 ? envR : 8);
    this.p = params?.p ?? (Number.isFinite(envP) && envP > 0 ? envP : 1);
    this.keylen = params?.keylen ?? (Number.isFinite(envKeylen) && envKeylen > 0 ? envKeylen : 64);
  }

  async hash(plain: string): Promise<{ hash: string; salt?: string | null }> {
    const { randomBytes, scrypt } = await import('crypto');
    const saltBuf = randomBytes(16);
    const saltB64 = saltBuf.toString('base64');
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      scrypt(plain, saltBuf, this.keylen, { N: this.N, r: this.r, p: this.p }, (err, dk) => {
        if (err) return reject(err);
        resolve(dk as Buffer);
      });
    });
    const hashB64 = derivedKey.toString('base64');
    const header = `scrypt:N=${this.N},r=${this.r},p=${this.p},keylen=${this.keylen}`;
    const packed = `${header}$${saltB64}$${hashB64}`;
    return { hash: packed, salt: saltB64 };
  }

  async verify(plain: string, hash: string, salt?: string | null): Promise<boolean> {
    try {
      const { scrypt } = await import('crypto');

      let N = this.N;
      let r = this.r;
      let p = this.p;
      let keylen = this.keylen;
      let saltB64 = salt ?? null;
      let expectedB64: string | null = null;

      // Try parse hash format if present
      // Expected format: scrypt:N=...,r=...,p=...,keylen=...$<salt>$<hash>
      if (hash.startsWith('scrypt:')) {
        const parts = hash.split('$');
        const header = parts[0];
        if (parts.length === 3) {
          saltB64 = saltB64 ?? parts[1];
          expectedB64 = parts[2];
        }
        const paramsPart = header.split(':')[1] || '';
        const kvs = paramsPart.split(',');
        for (const kv of kvs) {
          const [k, v] = kv.split('=');
          const num = parseInt(v, 10);
          if (Number.isFinite(num)) {
            if (k === 'N') N = num;
            else if (k === 'r') r = num;
            else if (k === 'p') p = num;
            else if (k === 'keylen') keylen = num;
          }
        }
      }

      if (!saltB64) return false; // cannot verify without salt
      const saltBuf = Buffer.from(saltB64, 'base64');

      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        scrypt(plain, saltBuf, keylen, { N, r, p }, (err, dk) => {
          if (err) return reject(err);
          resolve(dk as Buffer);
        });
      });
      const actualB64 = derivedKey.toString('base64');

      if (expectedB64) {
        // Compare timing-safe
        return this.timingSafeEqualB64(actualB64, expectedB64);
      }

      // If no packed format, assume hash string is the base64 of the derived key
      return this.timingSafeEqualB64(actualB64, hash);
    } catch {
      return false;
    }
  }

  private timingSafeEqualB64(aB64: string, bB64: string): boolean {
    const { timingSafeEqual } = require('crypto');
    const a = Buffer.from(aB64);
    const b = Buffer.from(bB64);
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
