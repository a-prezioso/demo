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

---

# Dettagli di implementazione (MVP attuale)

Questa sezione documenta lo stato effettivo dell’implementazione presente nel codice (MVP), allineata ai test di integrazione/unità.

## Panoramica access/refresh token
- Formato access token: JWT firmato HS256.
- Claims principali: sub (userId), email, roles (opzionale), iss, aud, iat, exp.
- Durate di default (configurabili via env):
  - ACCESS_TOKEN_TTL (secondi), default 900 (15 min)
  - REFRESH_TOKEN_TTL (secondi), default 2592000 (30 giorni)
- Generazione/Verifica: gestite da JwtService, che si appoggia alla secret in JWT_SECRET. La verifica esegue anche controlli di exp/iat/nbf e issuer/audience se presenti.

## Middleware JWT e protezione rotte
- Middleware: requireAuth (src/core/jwt/authMiddleware.ts)
  - Estrae il token dal header Authorization: "Bearer <token>".
  - Verifica integrità e scadenza (JwtService.verify). In caso di errore:
    - Nessun header o token mancante -> 401 { error: "unauthorized" }
    - Token scaduto -> 401 { error: "token_expired" }
    - Token malformato o firma non valida -> 401 { error: "invalid_token" }
  - Se valido, allega a req.user: { id, email, roles } e a req.auth: { claims }.
  - Supporta controllo ruoli opzionale: requireRoles(["admin"]) risponde 403 { error: "forbidden" } se i ruoli non soddisfano i requisiti.
- Rotte protette nel server (src/server.ts):
  - Prefisso /api/private protetto globalmente con requireAuth.
  - Esempi:
    - GET /api/private/ping -> 200 se token valido; 401 altrimenti.
    - GET /api/protected/profile -> protetto con requireAuth, restituisce profilo minimo.
    - GET /api/admin/overview -> protetto con requireRoles(["admin"]).

## Specifica endpoint /api/auth/refresh (stato attuale)
- Metodo/URL: POST /api/auth/refresh
- Input accettato:
  - Body JSON: { "refreshToken": "<token>" }
  - Oppure cookie "refreshToken" o "rt" (se inviato dal client). Il server attuale non imposta cookie; accetta solo per comodità.
- Validazioni:
  - Se manca il token -> 400 { error: "invalid_input" }
  - Calcolo hash del token e lookup della sessione attiva e non revocata.
  - Se assente, scaduta o revocata -> 401 { error: "invalid_refresh" }
  - Verifica che l’utente esista e sia ACTIVE; altrimenti revoca la sessione e risponde 401.
- Risposta (MVP):
  - 200 { accessToken: string, tokenType: "Bearer", expiresIn: number }
  - Nota: nel MVP non viene ruotato/emesso un nuovo refresh token nella risposta; il refresh token rimane invariato. La rotazione è consigliata in produzione.
- Codici di errore:
  - 400 invalid_input
  - 401 invalid_refresh

## Specifica endpoint /api/auth/logout (stato attuale)
- Metodo/URL: POST /api/auth/logout
- Body:
  - { refreshToken: string } per logout della singola sessione
  - { refreshToken: string, all: true } per revocare tutte le sessioni dell’utente associato a quel refresh token
  - Cookie: opzionalmente può leggere "refreshToken"/"rt"; il server non imposta cookie.
- Risposte:
  - 204 No Content (idempotente)
  - 400 { error: "invalid_input" } se mancano parametri necessari per all=true

## Esempi richieste/risposte

### Login
Richiesta:

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"ValidP@ssw0rd!"}'

Risposta 200:
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque-token>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshExpiresIn": 2592000,
  "user": { "id": "<uuid>", "email": "user@example.com", "status": "ACTIVE" }
}

### Accesso a risorsa protetta
Richiesta:

curl http://localhost:3000/api/private/ping \
  -H "Authorization: Bearer <jwt>"

Risposte:
- 200 { "pong": true, "userId": "<uuid>" }
- 401 { "error": "unauthorized" | "invalid_token" | "token_expired" }

### Refresh token (MVP)
Richiesta con body:

curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<opaque-token>"}'

Oppure con cookie inviato dal client:

curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refreshToken=<opaque-token>"

Risposta 200:
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 900
}

Errori possibili:
- 400 { "error": "invalid_input" }
- 401 { "error": "invalid_refresh" }

### Logout

curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<opaque-token>"}'

Risposta: 204 No Content

## Note di sicurezza (raccomandazioni)
- Usa sempre HTTPS/TLS; non trasmettere token su canali non cifrati.
- Non salvare l’access token in localStorage. Preferire:
  - In SPA: conservare l’access token solo in memoria (variabile runtime) e rinnovarlo con refresh token.
  - Conservare il refresh token in cookie HttpOnly+Secure con SameSite=Lax/Strict, impostato dal frontend (il backend MVP non imposta cookie).
- Non loggare mai token (né access né refresh) o segreti (JWT_SECRET). I log devono essere redatti.
- TTL breve per access token (es. 15 min) limita l’impatto in caso di furto; prevedere revoca/blacklist per refresh token.
- In caso di furto di refresh token, un attaccante può ottenere nuovi access token finché la sessione non è revocata o scade: prevedere
  - Logout/all: POST /api/auth/logout { all: true }
  - Rotazione del refresh token ad ogni uso (da implementare in futuro) e rilevamento uso anomalo (token reuse detection).
- Proteggere endpoint di login con rate limit/lockout; monitorare tentativi falliti.
- Validare e sanificare sempre gli input; non esporre dettagli sugli errori (es. distinguere email inesistente vs password errata).

## Variabili d’ambiente rilevanti
- JWT_SECRET: segreto HMAC (consigliato >= 256 bit)
- JWT_ISSUER / JWT_AUDIENCE: issuer e audience attese
- ACCESS_TOKEN_TTL / REFRESH_TOKEN_TTL: durate in secondi
- JWT_CLOCK_SKEW_SEC: tolleranza clock skew in verifica token (default 30s)

## Allineamento implementazione vs. design
- Refresh rotation: nel design è prevista; nel MVP la risposta di /api/auth/refresh restituisce solo un nuovo access token e NON un nuovo refresh token. Il token di refresh rimane invariato nella sessione.
- Cookie: il backend accetta refresh token anche via cookie ("refreshToken" o "rt"), ma non setta cookie nelle risposte. Il frontend può gestire un cookie HttpOnly.
- Ruoli: supporto base nel payload e nel middleware (requireRoles), ma non c’è gestione persistente dei ruoli al momento.
