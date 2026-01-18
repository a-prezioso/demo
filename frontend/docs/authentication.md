# Autenticazione Frontend (PWA) – Architettura e Flussi

Questa documentazione descrive come è stata implementata la gestione dell’autenticazione nella PWA, con particolare attenzione a componenti, flussi, persistenza token, sicurezza e linee guida per sviluppare nuove feature allineate al backend.

Indice
- Architettura (panoramica componenti)
- Flusso di login
- Flusso di signup
- Persistenza token e implicazioni di sicurezza
- Come allegare i token alle richieste (Authorization header)
- Logout e pulizia dei token
- Aggiungere nuove route protette
- TODO / Miglioramenti futuri


Architettura (panoramica componenti)
- AuthContext/AuthProvider (src/auth/AuthContext.tsx)
  - Espone stato di autenticazione a tutta l’app (isAuthenticated, accessToken, refreshToken, user) e helper (setAuth, logout).
  - Inizializza lo stato da localStorage per persistere la sessione dopo refresh della pagina.
- authService (src/api/authService.ts)
  - Client minimale per endpoint backend di login e signup (POST /api/auth/login e POST /api/auth/signup).
  - Salva i token tramite tokenStorage (saveAuthTokens) al successo di login/signup.
- ProtectedRoute (src/auth/ProtectedRoute.tsx) + routerHelpers
  - Componente router-agnostico per proteggere pagine private reindirizzando al login quando l’utente non è autenticato.
- tokenStorage (src/utils/tokenStorage.ts)
  - Fornisce funzioni per salvare/recuperare/clearing di accessToken, refreshToken e dati utente in localStorage.


Flusso di login
Sequenza logica:

Utente -> LoginForm -> authService.login -> Backend /api/auth/login -> tokenStorage.save + AuthContext.setAuth -> App

Dettagli:
1) L’utente inserisce email e password e invia il form.
2) authService.login chiama POST /api/auth/login con { email, password }.
3) Il backend risponde con { accessToken, refreshToken, user, ... }.
4) Il client salva i token con tokenStorage.saveAuthTokens e aggiorna AuthContext.setAuth.
5) L’app può navigare verso l’area privata (es. /app).


Flusso di signup
Sequenza logica:

Utente -> SignupForm -> authService.signup -> Backend /api/auth/signup -> tokenStorage.save + AuthContext.setAuth -> App

Dettagli:
1) L’utente inserisce email, password e conferma e invia il form.
2) authService.signup chiama POST /api/auth/signup con { email, password }.
3) Il backend crea l’utente e risponde con { accessToken, refreshToken, user } (login implicito dopo signup, se previsto) oppure solo i dati dell’utente (in questa codebase il client si attende token in risposta per semplificare l’onboarding).
4) Il client persiste i token e aggiorna lo stato AuthContext come per il login.


Persistenza token e implicazioni di sicurezza
- Dove sono salvati i token:
  - localStorage (chiavi: auth.accessToken, auth.refreshToken, auth.user).
  - Pro: semplicità d’uso e persistenza dopo il refresh della pagina.
  - Contro: esposti a rischi XSS; in presenza di XSS un attacker può esfiltrare i token.
- Alternative:
  - Cookie HttpOnly/SameSite per il refresh token (consigliato) e access token in memoria.
  - sessionStorage (evita persistenza tra sessioni ma non mitiga XSS).
- Misure raccomandate:
  - Minimizzare superfici XSS (Content Security Policy, sanitizzazione, dipendenze aggiornate).
  - Considerare la migrazione del refresh token su cookie HttpOnly con SameSite=Lax/Strict e Secure in produzione.
  - Valutare crittografia a riposo per localStorage (con chiave derivata non in chiaro nel client), tenendo presente che non elimina il rischio XSS ma alza l’asticella.


Come allegare i token alle richieste (Authorization header)
- Le chiamate protette verso il backend devono includere l’access token nell’header Authorization:
  - Authorization: Bearer <ACCESS_TOKEN>
- Questa codebase non fornisce (di proposito) un interceptor globale; si consiglia di implementare un piccolo wrapper fetch/axios per centralizzare:
  - L’aggiunta dell’Authorization header
  - La gestione del 401 con tentativo di refresh

Esempio di wrapper con fetch:

import { getAccessToken, getRefreshToken, saveAuthTokens, clearAuthTokens } from 'smartdesk-frontend/dist/utils/tokenStorage';

async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const at = getAccessToken();
  const headers = new Headers(init.headers || {});
  if (at) headers.set('Authorization', `Bearer ${at}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(input, { ...init, headers });
  if (res.status !== 401) return res;

  // Prova refresh token
  const rt = getRefreshToken();
  if (!rt) return res;

  const refreshRes = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });

  if (!refreshRes.ok) {
    // Refresh fallito -> logout client side
    clearAuthTokens();
    return res; // lascia al chiamante gestire il 401
  }

  const data = await refreshRes.json();
  // Se il backend ritorna anche un nuovo refreshToken, salvarlo.
  saveAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });

  // Ritenta la richiesta originale con nuovo access token
  const headers2 = new Headers(init.headers || {});
  headers2.set('Authorization', `Bearer ${data.accessToken}`);
  headers2.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers: headers2 });
}

Nota: adattare il baseUrl secondo la vostra configurazione.


Logout e pulizia dei token
- AuthContext espone logout(), che chiama clearAuthTokens() e azzera lo stato in memoria.
- È consigliato anche revocare server-side la sessione refresh:
  - POST /api/auth/logout { refreshToken }
  - In caso di fallimento della chiamata, il client deve comunque rimuovere i token locali.

Esempio:

import { getRefreshToken, clearAuthTokens } from 'smartdesk-frontend/dist/utils/tokenStorage';

async function logout() {
  const rt = getRefreshToken();
  try {
    if (rt) {
      await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) });
    }
  } finally {
    clearAuthTokens();
    // opzionale: navigate('/login')
  }
}


Aggiungere nuove route protette
- Con react-router v6:

import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from 'smartdesk-frontend/dist/auth/ProtectedRoute';
import { useAuth } from 'smartdesk-frontend/dist/auth/AuthContext';

const Redirector = ({ to }: { to: string }) => <Navigate to={to} replace />;

function AppRouter() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            element={<Dashboard />}
            toLogin="/login"
            redirect={(to) => <Redirector to={to} />}
          />
        }
      />
    </Routes>
  );
}

- Router-agnostico: ProtectedRoute accetta una funzione redirect che deve restituire l’elemento di redirect compatibile con il router usato.


TODO / Miglioramenti futuri
- Spostare il refresh token su cookie HttpOnly/Secure/SameSite ed evitare la sua esposizione a JS; valutare l’access token solo in memoria.
- Implementare un meccanismo standard di refresh automatico (interceptor) con coda richieste mentre il refresh è in corso, evitando race condition.
- Gestire la scadenza dell’access token lato client (decodifica JWT e auto-logout/refresh proattivo vicino alla scadenza).
- Sincronizzare logout tra tab (storage events) e invalidare cache/persistenze.
- Implementare rotazione dei refresh token (se il backend la supporta) e rilevazione di reuse.
- Aggiungere metriche/telemetria sugli eventi di autenticazione (login, logout, refresh, errori).
- Hardening CSP, Subresource Integrity, e analisi periodiche delle dipendenze per ridurre il rischio XSS.

Riferimenti backend
- Endpoint:
  - POST /api/auth/login
  - POST /api/auth/signup
  - POST /api/auth/refresh
  - POST /api/auth/logout
- I payload e le semantiche sono documentati in backend/docs/authentication.md
