SmartDesk Coworking - Data Model and Migrations

This repository branch contains database artifacts to support user signup.

Paths
- db/migrations: SQL migrations (PostgreSQL)
- docs/user_model.md: User model documentation

Applying the migration (PostgreSQL)
- Requires extensions: citext, pgcrypto
- Run in psql:
  \i db/migrations/0001_create_users.sql

Conventions
- Columns are snake_case
- Do NOT log sensitive fields: password_hash, salt, verification_token
- Email is unique and case-insensitive via CITEXT

License
- Internal demo artifacts
