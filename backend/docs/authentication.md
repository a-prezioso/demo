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
   - Crea sessione con refresh token (archivia hash del refresh token) e metadati (ip, userAgent, fingerprint) e durata
   - Ritorna { accessToken, refreshToken, tokenType, expiresIn, refreshExpiresIn, user }

### Signup
1) Client invia POST /api/auth/signup con { email, password }.
2) Server valida email e password (policy), crea utente con password hashata e stato di default (ACTIVE, o PENDING se verifica email richiesta).
3) Opzionalmente effettua login implicito: genera coppia di token come nel login.

## Refresh e Logout
- POST /api/auth/refresh: accetta refreshToken (body o cookie) e, se valido e non revocato/expired, emette un nuovo access token (ed eventualmente ruota il refresh token, se abilitata la rotazione).
- POST /api/auth/logout: revoca la sessione associata a quel refresh token e invalida ulteriori refresh.

## Frontend (PWA)
La PWA utilizza i seguenti componenti (vedi frontend/docs/authentication.md per i dettagli implementativi):
- AuthContext/AuthProvider: stato auth globale con persistenza in localStorage
- authService: wrapper fetch per login/signup e salvataggio token
- ProtectedRoute: guard router-agnostico
- tokenStorage: utility per salvare/leggere/clearing token

Sequence semplificata (login):
Utente -> LoginForm -> authService.login -> Backend /login -> tokenStorage.save + AuthContext.setAuth -> Navigazione area privata

Persistenza token:
- Demo attuale: localStorage (accessToken, refreshToken, user)
- Considerazioni sicurezza: esposto a XSS; suggerito passaggio a cookie HttpOnly per refresh token e access token in memoria

Allegare token alle chiamate:
- Authorization: Bearer <ACCESS_TOKEN>

Logout:
- Client: clearAuthTokens + (opzionale) POST /api/auth/logout { refreshToken }

## TODO / Miglioramenti
- Cookie HttpOnly/Secure/SameSite per refresh token
- Interceptor di refresh con coda richieste
- Rotazione refresh token e rilevazione reuse
- Auto-logout/refresh proattivo in prossimità scadenza
- Sincronizzazione logout cross-tab

## Riferimenti
- Frontend docs: frontend/docs/authentication.md
- Moduli backend: src/core/jwt, src/modules/auth, src/modules/user
- Migrazioni Prisma: prisma/migrations (users, sessions)
