SmartDesk Coworking - Data Model and Migrations

This repository branch contains database artifacts to support user signup.

Paths
- db/migrations: SQL migrations (PostgreSQL)
- docs/user_model.md: User model documentation
- src/security: Security services (password hashing/verification and input validation)
- src/api: Minimal HTTP API server exposing /api/auth/signup
- src/db: Database client (pg)

Applying the migration (PostgreSQL)
- Requires extensions: citext, pgcrypto
- Run in psql:
  \i db/migrations/0001_create_users.sql

Conventions
- Columns are snake_case
- Do NOT log sensitive fields: password_hash, salt, verification_token
- Email is unique and case-insensitive via CITEXT

Security services
- passwordService: hashPassword(plain), verifyPassword(plain, hash)
- validationService: validateEmail(email) -> {valid, email, error}; validatePassword(pwd) -> {valid, error}
- Config via env:
  SECURITY_SCRYPT_N (default 16384)
  SECURITY_SCRYPT_R (8)
  SECURITY_SCRYPT_P (1)
  SECURITY_SCRYPT_KEYLEN (64)
  SECURITY_SALT_LEN (16)
  SECURITY_PASSWORD_MIN_LENGTH (10)
  SECURITY_PASSWORD_REQUIRE_UPPERCASE (true)
  SECURITY_PASSWORD_REQUIRE_LOWERCASE (true)
  SECURITY_PASSWORD_REQUIRE_NUMBER (true)
  SECURITY_PASSWORD_REQUIRE_SYMBOL (true)
  SECURITY_PASSWORD_FORBID_COMMON (true)

Running the API locally
- Ensure PostgreSQL is running and migration applied
- Set env variables (example):
  export PGHOST=127.0.0.1
  export PGPORT=5432
  export PGUSER=postgres
  export PGPASSWORD=yourpass
  export PGDATABASE=smartdesk
- Start server:
  npm install
  npm start
- Healthcheck: GET http://localhost:3000/health
- Signup: POST http://localhost:3000/api/auth/signup
  Body JSON: { "email": "user@example.com", "password": "Str0ng!Passw0rd" }

Errors
- 400: invalid input (email/password)
- 409: email already registered
- 500: internal server error

License
- Internal demo artifacts
