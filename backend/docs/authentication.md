# SmartDesk Coworking - Autenticazione JWT (Design)

Obiettivo: autenticazione basata su email e password con emissione di token JWT di accesso (access token) e refresh token per mantenere sessioni sicure nella PWA.

## Stato attuale (analisi)
- Tabella utenti (users) già definita in Prisma/DB con campi: id (UUID), email (unique), password_hash (+ salt opzionale), status (ACTIVE/PENDING/SUSPENDED/DISABLED), verification_token (+expires), created_at, updated_at.
- Non esistono ancora ruoli/profili né strutture per la gestione delle sessioni/refresh token.

Decisioni:
- Lasciare i ruoli fuori scope per ora; il payload JWT supporterà un array ruoli vuoto o opzionale per futura estensione.
- Aggiungere una tabella sessions per tracciare e revocare refresh token per singolo dispositivo/sessione.

## Flusso di autenticazione

### Login (email+password -> access+refresh token)
1) Client invia POST /api/auth/login con { email, password }.
2) Server normalizza e valida input, verifica esistenza utente e stato account:
   - Se status DISABLED o SUSPENDED -> 403 (account_disabled)
   - Se status PENDING (non verificato) -> 403 (account_unverified)
3) Verifica password con hash (scrypt/bcrypt). Se errata:
   - Incrementa contatore tentativi falliti (rate limit/lockout layer) e risponde 401 (invalid_credentials)
4) Se corretta:
   - Genera access token JWT (breve durata)
   - Crea sessione con refresh token (archivia hash del refresh token) e metadati (ip, userAgent, fingerprint) e durata lunga
   - Restituisce { accessToken, refreshToken, expiresIn, refreshExpiresIn, tokenType: "Bearer" }

### Refresh (refresh token -> nuovo access token e refresh rotation)
1) Client invia POST /api/auth/refresh con { refreshToken } oppure tramite cookie HttpOnly Secure.
2) Server calcola hash e cerca la sessione attiva e non revocata:
   - Se non trovata o scaduta -> 401 (invalid_refresh)
3) Applica rotation sicura:
   - Invalida il refresh token corrente (aggiorna hash e timestamps) e emette nuovo refresh token
   - Genera nuovo access token
4) Risponde con nuova coppia token.

### Logout
- Client invia POST /api/auth/logout indicando sessionId o usando refreshToken.
- Server marca la sessione come revocata (revoked_at = now()).

### Revoca globale
- Su reset password o disattivazione account, revocare tutte le sessioni dell'utente (revoked_at per tutte le sessioni attive).

## Diagrammi di flusso (alto livello)

Login

  [Client]
     |  email, password
     v
  [POST /api/auth/login]
     |-- validate -> lookup user -> check status
     |-- verify password
     |   |-- fail -> 401 invalid_credentials (rate-limit/lockout)
     |   `-- ok
     |-- issue access JWT (short ttl)
     |-- create session + refresh token (store hash)
     `-- 200 {accessToken, refreshToken,...}

Refresh

  [Client]
     |  refreshToken
     v
  [POST /api/auth/refresh]
     |-- validate -> lookup session by refreshTokenHash
     |-- check not expired and not revoked
     |-- rotate refresh token (update hash)
     |-- issue new access JWT
     `-- 200 {accessToken, refreshToken,...}

Logout

  [Client]
     |  sessionId or refreshToken
     v
  [POST /api/auth/logout]
     `-- mark session revoked

## JWT: payload minimo e regole
- Algoritmo: HS256 (HMAC-SHA256). Chiave segreta gestita tramite variabili d’ambiente sicure.
- Payload minimo (claims standard + app):
  - sub: userId (UUID)
  - email: email utente normalizzata
  - roles: array stringhe (opzionale, default [])
  - iss: issuer (es. smartdesk.api)
  - aud: audience (es. smartdesk.pwa)
  - iat: issued-at (epoch seconds)
  - exp: expiry (epoch seconds)
  - tnt: tenantId opzionale (per multi-tenant futuri)
- Header: { alg: "HS256", typ: "JWT" }

Esempio payload:
{
  "sub": "b3f3a7c4-1234-5678-9abc-def012345678",
  "email": "user@example.com",
  "roles": [],
  "iss": "smartdesk.api",
  "aud": "smartdesk.pwa",
  "iat": 1700000000,
  "exp": 1700000900
}

## Durate e configurazione
- Access token TTL: 15 minuti (configurabile via ACCESS_TOKEN_TTL, espressa in secondi)
- Refresh token TTL: 30 giorni (configurabile via REFRESH_TOKEN_TTL)
- Algoritmo: JWT_ALG=HS256
- Secret management: JWT_SECRET (min 256 bit; preferibilmente Base64 e caricata da secret manager in produzione). Supporto opzionale rotazione: JWT_SECRET_PREVIOUS.

## Gestione errori
- 400 invalid_input: formati non validi
- 401 invalid_credentials: email o password errate
- 401 invalid_refresh: refresh token non valido o scaduto
- 403 account_disabled: status DISABLED o SUSPENDED
- 403 account_unverified: status PENDING (se richiesto email verified)
- 429 too_many_requests: rate limiting superato
- 500 internal_error: errori inattesi

## Rate limiting e lockout
- Rate limiting a livello IP e account per endpoint /login (es. 5-10 tentativi/15 min)
- Lockout incrementale: dopo N tentativi falliti, blocca login per M minuti (config: LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MIN, LOGIN_LOCKOUT_MIN)
- Registrare tentativi falliti in log sicuri (senza dati sensibili). L’implementazione del contatore non è inclusa in questo design.

## Tracciamento sessioni e refresh token
- Tabella sessions: salva hash del refresh token, non il token in chiaro.
- Campi principali: id (uuid), user_id, refresh_token_hash, issued_at, expires_at, revoked_at (nullable), user_agent/ip/fingerprint (opzionali), created_at/updated_at.
- Indici per ricerche rapide su user_id, expires_at, revoked_at.
- Revoca: impostare revoked_at; le richieste di refresh devono fallire se la sessione è revocata o scaduta.
- Rotation: ad ogni refresh, generare un nuovo refresh token e aggiornare refresh_token_hash nella stessa sessione (opzionale: creare nuova sessione e revocare la precedente).

## Estensioni future
- Ruoli/profili: aggiungere tabella roles e tabella user_roles (N:N) oppure campo roles JSONB per casi semplici.
- Verifica email: forzare status ACTIVE solo dopo verifica.
- Multi-tenant: aggiungere tabella tenants e campo tenant_id su users e sessions.

## Sicurezza
- Impostare cookie HttpOnly+Secure+SameSite=Lax/Strict per il refresh token lato web (opzionale: anche per access token se non si usa Authorization header).
- Non loggare mai password, hash, salt o token.
- Invalida tutte le sessioni su reset password.

## API (contratti previsionali)
- POST /api/auth/login
  - Body: { email: string, password: string }
  - 200: { accessToken: string, refreshToken: string, tokenType: "Bearer", expiresIn: number, refreshExpiresIn: number }
- POST /api/auth/refresh
  - Body: { refreshToken: string }
  - 200: { accessToken: string, refreshToken: string, tokenType: "Bearer", expiresIn: number, refreshExpiresIn: number }
- POST /api/auth/logout
  - Body: { sessionId?: string, refreshToken?: string }
  - 204: no content

## Modello dati aggiuntivo (Prisma)
Vedi schema.prisma per il modello Session. Migrazione inclusa: prisma/migrations/202601180002_auth_sessions.
