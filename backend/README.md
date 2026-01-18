Backend scaffolding for SmartDesk Coworking API

This folder contains early scaffolding for the backend. Tech stack: Node.js (18+), TypeScript.

Current scope
- User domain model (TypeScript interface + enums)
- Utility to redact sensitive fields from logs
- Initial PostgreSQL migration to create the users table

Notes
- Email is stored as CITEXT and is unique (case-insensitive)
- Primary key uses UUID v4 (db default via uuid-ossp)
- Passwords are NEVER stored in plaintext; only password_hash
- Consider using argon2id or bcrypt with cost parameters aligned to production hardware
- Do not log sensitive columns; use userForLog() utility
