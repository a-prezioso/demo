# Autenticazione JWT e Flusso di Refresh

Versione: 1.1
Data: 18/01/2026
Autore: Security/Backend Team
Stato: Draft

---

1. Scopo

Questo documento descrive l’architettura di autenticazione basata su JWT (JSON Web Token) adottata dal progetto, con particolare attenzione a:
- meccanismo di access token e refresh token (durata, formato, claim)
- middleware JWT e regole di protezione delle rotte
- specifica dell’endpoint /api/auth/refresh
- esempi di richieste/risposte
- note di sicurezza e raccomandazioni per il front‑end
- collegamento al documento di implementazione frontend dei token (docs/frontend-authentication.md)

Il contenuto è allineato alla struttura applicativa descritta in docs/architecture.md e docs/source-tree.md (modulo core/security + modulo auth).

---

2. Panoramica: Access Token e Refresh Token

2.1. Meccanismo
- Access token: JWT firmato con scadenza breve, usato nell’header Authorization: Bearer <token> per accedere alle API protette.
- Refresh token: JWT con scadenza lunga, usato esclusivamente per ottenere un nuovo access token senza reinserire le credenziali.
- Stateless: la verifica avviene con la sola firma JWT; opzionalmente può essere prevista una blacklist/whitelist per revoca/rotation (vedi 6. Note di sicurezza).

2.2. Durate consigliate (override via config/env)
- ACCESS_TTL: 15m (es. 15 minuti)
- REFRESH_TTL: 7d (es. 7 giorni)

2.3. Algoritmo e segreti
- Algoritmo: HS256 (HMAC con secret) oppure RS256 (coppia chiavi). Default: HS256.
- Variabili ambiente previste (backend):
  - JWT_ALG=HS256
  - JWT_SECRET=<obbligatorio se HS256>
  - JWT_PRIVATE_KEY / JWT_PUBLIC_KEY=<se RS256>
  - JWT_ACCESS_TTL=15m
  - JWT_REFRESH_TTL=7d
  - JWT_ISS=demo.api

2.4. Claims principali
- Standard:
  - iss: emittente (es. demo.api)
  - sub: subject (user id UUID)
  - iat: issued at (epoch seconds)
  - exp: expiry (epoch seconds)
- Personalizzati:
  - type: "access" | "refresh"
  - roles: array ruoli utente (es. ["ADMIN", "PM", "USER"]) oppure scope
  - jti: id univoco token (raccomandato per refresh rotation)

Esempio payload access token:
{
  "iss": "demo.api",
  "sub": "f2b6c6f0-9c9d-4ef8-8a4c-1c7a0b0c8d11",
  "iat": 1737180000,
  "exp": 1737180900,
  "type": "access",
  "roles": ["USER"]
}

Esempio payload refresh token:
{
  "iss": "demo.api",
  "sub": "f2b6c6f0-9c9d-4ef8-8a4c-1c7a0b0c8d11",
  "iat": 1737180000,
  "exp": 1737784800,
  "type": "refresh",
  "jti": "e0a1f6d0-6a2c-4d1a-8a92-5fae1b9ad1cd"
}

---

3. Middleware JWT e Protezione Rotte

3.1. Componenti (Core Layer)
- core/security/jwtService.ts: creazione e validazione JWT (access/refresh)
- core/http/middleware/authGuard.ts: middleware che applica le regole di accesso
- core/http/routes.ts: registra middleware e rotte

3.2. Regole generali
- Il middleware legge l’header Authorization: Bearer <access_token>.
- Se il token è valido e non scaduto:
  - Decodifica il payload e lo allega al contesto richiesta (es. req.user = { id, roles }).
  - Consente l’accesso se i permessi/ruoli richiesti dalla rotta sono soddisfatti.
- Se il token manca o è invalido:
  - 401 Unauthorized per token mancante/scaduto/invalido.
  - 403 Forbidden se l’utente autenticato non ha i permessi richiesti.

3.3. Rotte pubbliche vs protette
- Pubbliche (nessun JWT richiesto):
  - POST /api/auth/login
  - POST /api/auth/refresh (richiede refresh token via cookie o body, vedi sezione 4)
  - GET /api/admin/health (se esposta)
- Protette (JWT access richiesto):
  - GET /api/users/me
  - Tutte le rotte sotto /api/projects, /api/documents, /api/generation, /api/generated-docs
  - Rotte amministrative: /api/admin/** (possono richiedere ruolo ADMIN)

3.4. Mapping errori middleware
- 401 Unauthorized
  - MISSING_TOKEN: Header Authorization assente
  - INVALID_TOKEN: Firma non valida o formato errato
  - EXPIRED_TOKEN: Token scaduto
- 403 Forbidden
  - INSUFFICIENT_PERMISSIONS: Ruolo/permisso richiesto non presente

Payload errore tipico:
{
  "error": "INVALID_TOKEN",
  "message": "JWT signature verification failed",
  "status": 401
}

---

4. Endpoint: POST /api/auth/refresh

4.1. Scopo
- Ottenere un nuovo access token quando l’attuale è scaduto o sta per scadere.
- Non richiede header Authorization; richiede un refresh token valido.

4.2. URL e Metodo
- POST /api/auth/refresh

4.3. Input supportati
- Opzione A (raccomandata – cookie HttpOnly):
  - Cookie: refresh_token=<JWT>
  - Sicurezza: HttpOnly; Secure (in produzione); SameSite=Lax o Strict
- Opzione B (alternativa – JSON body):
  - Content-Type: application/json
  - Body: { "refreshToken": "<JWT>" }

4.4. Comportamento
- Valida firma e scadenza del refresh token.
- Verifica claim type == "refresh"; opzionale: verifica jti non revocato/riutilizzato.
- Emette nuovo access token e, se abilitata refresh rotation, emette anche un nuovo refresh token (sostituendo quello precedente nel cookie/risposta).
- Rate limit consigliato (es. max 5/min per IP o jti).

4.5. Risposta (200 OK)
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshToken": "<JWT>" // opzionale: presente solo se si effettua rotation
}

Se si usa cookie, il nuovo refresh token è impostato in Set-Cookie: refresh_token=<JWT>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh; Max-Age=604800

4.6. Codici di errore
- 400 Bad Request
  - MISSING_REFRESH_TOKEN: nessun token nel cookie/body
- 401 Unauthorized
  - INVALID_REFRESH_TOKEN: firma o formato non validi
  - EXPIRED_REFRESH_TOKEN: token scaduto
- 409 Conflict (opzionale, se rotation + rilevazione riuso)
  - REFRESH_TOKEN_REUSE: rilevato riuso di un refresh revocato (possibile compromissione)
- 429 Too Many Requests
  - RATE_LIMIT_EXCEEDED: superata soglia di richieste

Payload errore tipico:
{
  "error": "EXPIRED_REFRESH_TOKEN",
  "message": "Refresh token expired",
  "status": 401
}

---

5. Esempi di richieste/risposte

5.1. Login (per contesto; risposta indicativa)
Request:
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secret"
  }'

Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // se non si usa cookie
}

Set-Cookie (se cookie abilitato):
Set-Cookie: refresh_token=eyJhbGciOi...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh; Max-Age=604800

5.2. Accesso a rotta protetta
Request:
curl https://api.example.com/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

Response 200:
{
  "id": "f2b6c6f0-9c9d-4ef8-8a4c-1c7a0b0c8d11",
  "email": "user@example.com",
  "status": "ACTIVE",
  "createdAt": "2026-01-18T09:00:00.000Z",
  "updatedAt": "2026-01-18T09:00:00.000Z"
}

Errori tipici:
- Response 401 (token scaduto): { "error": "EXPIRED_TOKEN", "status": 401 }
- Response 403 (permessi): { "error": "INSUFFICIENT_PERMISSIONS", "status": 403 }

5.3. Refresh via cookie (consigliato)
Request:
curl -X POST https://api.example.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refresh_token=eyJhbGciOiJIUzI1NiIs..."

Response 200:
{
  "accessToken": "<nuovo JWT>",
  "tokenType": "Bearer",
  "expiresIn": 900
}

Set-Cookie (se rotation):
Set-Cookie: refresh_token=<nuovo JWT>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh; Max-Age=604800

5.4. Refresh via JSON body (alternativa)
Request:
curl -X POST https://api.example.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }'

Response 401 (token invalido):
{
  "error": "INVALID_REFRESH_TOKEN",
  "message": "JWT signature verification failed",
  "status": 401
}

---

6. Note di Sicurezza e Raccomandazioni

6.1. Conservazione sicura dei token
- Preferire l’uso di cookie HttpOnly per il refresh token:
  - Mitiga i rischi di esfiltrazione via XSS.
  - Impostare sempre Secure in produzione (solo HTTPS) e SameSite=Lax o Strict.
- L’access token può essere memorizzato in memoria volatile dell’app (stato in React) o, con cautela, in sessionStorage; evitare localStorage se possibile.

6.2. Token theft e mitigazioni
- Scadenze brevi per l’access token riducono la finestra di abuso.
- Implementare refresh token rotation con jti + store server‑side (DB/Redis):
  - Alla richiesta di refresh, invalidare il vecchio jti e rilasciare un nuovo refresh token con nuovo jti.
  - Se si riceve un refresh token con jti già invalidato → REFRESH_TOKEN_REUSE (409) e forzare logout globale.
- Revocare token su eventi critici (reset password, sospensione utente, logout esplicito).

6.3. Raccomandazioni per il front‑end
- Inviare sempre Authorization: Bearer <accessToken> per le API protette.
- Intercettare le risposte 401 su rotte protette: tentare automaticamente un refresh (una sola volta) e ripetere la richiesta.
- Gestire fallback: se il refresh fallisce (401/409) → logout e redirect alla pagina di login.
- Se si utilizzano cookie HttpOnly per il refresh:
  - Abilitare credenziali CORS (withCredentials) e restringere l’origine (CORS allowlist).

6.4. Protezioni server aggiuntive
- Rate limiting sugli endpoint /api/auth/login e /api/auth/refresh.
- Helmet/security headers abilitati (HSTS, X-Content-Type-Options, ecc.).
- Logging senza dati sensibili (non loggare token, password, sali).
- Clock skew: ammettere un piccolo skew (±60s) nella validazione exp/iat.

6.5. Implicazioni in caso di furto token
- Furto access token: finestra limitata al TTL; invalidare lato client, opzionalmente inserire in deny‑list fino a scadenza.
- Furto refresh token: può estendere la sessione; usare rotation + revoca per limitare impatto. Forzare logout su tutti i device e rigenerare segreti in casi gravi.

---

7. Implementazione (riferimento moduli)

- core/security/jwtService.ts
  - signAccessToken(user): crea access token con claims standard + roles
  - signRefreshToken(user): crea refresh token con claim type=refresh e jti
  - verify(token): valida firma e scadenza
- core/http/middleware/authGuard.ts
  - Estrarrà Authorization, verificherà JWT, set req.user, controllerà ruoli
- modules/auth/api/authController.ts
  - POST /api/auth/login: verifica credenziali, emette access+refresh
  - POST /api/auth/refresh: esegue validazione/rotation e restituisce nuovo access (e refresh opzionale)

Frontend: vedere docs/frontend-authentication.md per implementazione AuthContext, ProtectedRoute, tokenStorage e flussi UI.

---

8. Change Log

- 1.1 (18/01/2026): Collegate le linee guida frontend e aggiunto riferimento a docs/frontend-authentication.md.
- 1.0 (18/01/2026): Prima versione del documento, allineata alla story "Proteggere API riservate con middleware JWT e endpoint refresh".
