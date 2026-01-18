"use strict";

// Security Password Service
// Implements password hashing and verification using Node's crypto.scrypt
// Parameters are configurable via environment variables. No sensitive data is logged.

const crypto = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(crypto.scrypt);

// Default parameters chosen for a good security/performance tradeoff on modern hardware.
// You can override via environment variables.
function getScryptParams() {
  const N = parseInt(process.env.SECURITY_SCRYPT_N || "16384", 10); // CPU/memory cost
  const r = parseInt(process.env.SECURITY_SCRYPT_R || "8", 10); // block size
  const p = parseInt(process.env.SECURITY_SCRYPT_P || "1", 10); // parallelization
  const keylen = parseInt(process.env.SECURITY_SCRYPT_KEYLEN || "64", 10); // derived key length
  const saltLen = parseInt(process.env.SECURITY_SALT_LEN || "16", 10); // salt length in bytes

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !Number.isFinite(keylen) || !Number.isFinite(saltLen)) {
    throw new Error("Invalid scrypt configuration provided via environment variables");
  }

  return { N, r, p, keylen, saltLen };
}

function encodeHash({ algo, params, salt, derivedKey }) {
  // Format: algo$N=...,r=...,p=...,keylen=...$base64(salt)$base64(derivedKey)
  const { N, r, p, keylen } = params;
  const saltB64 = salt.toString("base64");
  const dkB64 = derivedKey.toString("base64");
  return `${algo}$N=${N},r=${r},p=${p},keylen=${keylen}$${saltB64}$${dkB64}`;
}

function parseHash(hashString) {
  // Expected format: scrypt$N=...,r=...,p=...,keylen=...$saltB64$dkB64
  const parts = String(hashString || "").split("$");
  if (parts.length !== 4) {
    throw new Error("Invalid password hash format");
  }
  const [algo, paramStr, saltB64, dkB64] = parts;
  if (algo !== "scrypt") {
    throw new Error("Unsupported hash algorithm");
  }
  const params = {};
  paramStr.split(",").forEach((kv) => {
    const [k, v] = kv.split("=");
    params[k.replace(/^N$/, "N")] = Number(v);
  });
  const { N, r, p, keylen } = params;
  if (!N || !r || !p || !keylen) {
    throw new Error("Invalid scrypt parameters in hash");
  }
  const salt = Buffer.from(saltB64, "base64");
  const derivedKey = Buffer.from(dkB64, "base64");
  return { algo, params: { N, r, p, keylen }, salt, derivedKey };
}

async function hashPassword(plainPassword) {
  if (typeof plainPassword !== "string") {
    throw new Error("Password must be a string");
  }
  // DO NOT log passwords or hashes.
  const { N, r, p, keylen, saltLen } = getScryptParams();
  const salt = crypto.randomBytes(saltLen);
  const derivedKey = await scryptAsync(plainPassword, salt, keylen, { N, r, p });
  return encodeHash({ algo: "scrypt", params: { N, r, p, keylen }, salt, derivedKey });
}

async function verifyPassword(plainPassword, passwordHash) {
  if (typeof plainPassword !== "string" || typeof passwordHash !== "string") {
    return false;
  }
  try {
    const parsed = parseHash(passwordHash);
    const { N, r, p, keylen } = parsed.params;
    const rederived = await scryptAsync(plainPassword, parsed.salt, keylen, { N, r, p });
    // Use constant-time comparison
    const a = Buffer.from(parsed.derivedKey);
    const b = Buffer.from(rederived);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (_e) {
    // Never log sensitive data; on any parsing or crypto error, return false
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  // internal helpers exported for testing/advanced usage (no secrets)
  _getScryptParams: getScryptParams,
  _parseHash: parseHash,
  _encodeHash: encodeHash,
};
