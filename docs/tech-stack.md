# Tech Stack - demo

**Versione:** 1.0  
**Data:** 17/01/2026  
**Autore:** Architect Agent  

---

## 1. Panoramica Tecnologica

Il progetto **demo** è concepito (da architettura) come soluzione **full‑stack JavaScript/TypeScript** con:

- **Frontend:** SPA React
- **Backend:** Node.js con framework HTTP (Express o Fastify)
- **Database:** PostgreSQL
- **Storage file:** Object storage (es. S3) o filesystem dedicato
- **Autenticazione:** JWT (access + refresh token)
- **Job asincroni:** worker Node.js separato

Tuttavia, dal repository `elitesoftwarehouse/demo` attualmente risultano solo directory `.github` e `docs_re`, senza file di codice o di dipendenze (es. `package.json`, `tsconfig.json`, `Dockerfile`, ecc.).  
Di conseguenza, le tecnologie elencate sotto derivano **dall’architettura di riferimento** fornita, non da analisi effettiva di codice o configurazioni concrete.

Dove non sono presenti file per estrarre versioni reali, le versioni sono indicate come **raccomandate** / tipiche, coerenti con l’architettura.

---

## 2. Core Platform

| Tecnologia | Versione (indicativa) | Ruolo | Razionale |
|------------|-----------------------|-------|-----------|
| **Node.js** | 18 LTS o 20 LTS | Runtime backend & worker | Versioni LTS garantiscono stabilità, performance e supporto a lungo termine. |
| **TypeScript** | 5.x | Linguaggio tipizzato per frontend e backend | Riduce errori runtime, migliora manutenibilità e DX. |
| **npm** / **pnpm** / **yarn** | 9.x+ (npm, con Node 18) | Package manager | Gestione dipendenze e script di build / test. |
| **Express** *oppure* **Fastify** | 4.x (Express) / 4.x (Fastify) | Framework HTTP per API REST | Express per semplicità e standard de facto; Fastify per performance superiori su carichi elevati. |
| **React** | 18.x | Libreria UI frontend (SPA) | Ampio ecosistema, component model maturo, integrazione naturale con API REST e TypeScript. |

> Nota: senza `package.json` non è possibile fissare la versione esatta; le versioni sopra sono allineate allo stato dell’arte 2025–2026.

---

## 3. Data Layer

| Tecnologia | Versione (indicativa) | Ruolo |
|------------|-----------------------|-------|
| **PostgreSQL** | 14–16 | Database relazionale principale (USER, PROJECT, DOCUMENT, JOB, ecc.) |
| **Prisma** *oppure* **TypeORM/Knex** | Prisma 5.x / TypeORM 0.3.x | ORM / Query Builder per Node.js, mapping schema e migrazioni |
| **Migrazioni DB** (Prisma Migrate / TypeORM migrations / Flyway equivalente JS) | - | Gestione schema, evoluzione e versioning del database |

**Note:**

- L’architettura suggerisce **Prisma** come scelta preferita per DX (tipi generati, migrazioni integrate).
- I file binari (documenti sorgente, documentazione generata) **non vengono salvati in DB**, ma solo i metadati (path, MIME type, ecc.).

---

## 4. Presentation Layer

| Tecnologia | Versione (indicativa) | Ruolo |
|------------|-----------------------|-------|
| **React** | 18.x | Libreria per SPA e gestione componenti UI |
| **React Router** | 6.x | Routing client‑side (navigazione tra pagine: progetti, documenti, job, ecc.) |
| **TypeScript** | 5.x | Tipizzazione statica del frontend |
| **UI Library** (es. **Material UI** / **Chakra UI** / **Bootstrap React**) | MUI 5.x / Chakra 2.x / React-Bootstrap 2.x | Componenti UI pronti all’uso, layout responsivi |
| **React Query** *oppure* **Redux Toolkit / Zustand** | React Query 4.x | Gestione stato server (cache API, sincronizzazione con backend) |
| **Axios** *oppure* `fetch` | Axios 1.x | Client HTTP per chiamate alle API REST |
| **CSS / SCSS / CSS‑in‑JS** | ES6+ | Gestione stili (a seconda della libreria UI scelta) |

---

## 5. Security Stack

| Tecnologia / Meccanismo | Versione (indicativa) | Ruolo |
|-------------------------|-----------------------|-------|
| **JWT (JSON Web Token)** | RFC 7519 | Token‑based auth (access + refresh) |
| **Libreria JWT Node.js** (es. `jsonwebtoken`) | 9.x | Firma e verifica token sul backend |
| **bcrypt** / **argon2** | bcrypt 5.x / argon2 0.30+ | Hashing password sicuro |
| **Helmet** (middleware) | 7.x | HTTP security headers (HSTS, XSS protection, ecc.) |
| **CORS middleware** | - | Configurazione CORS per accesso SPA → API |
| **Rate limiting middleware** (es. `express-rate-limit`) | 7.x | Protezione da brute force e abusi su login e endpoint critici |

Autorizzazione basata su:

- **RBAC (Role-Based Access Control):** ruoli `ADMIN`, `PM`, `USER`
- Middleware custom per controllo ruoli e ownership delle risorse.

---

## 6. External Integrations

L’architettura non indica integrazioni specifiche con servizi esterni (API di terze parti) oltre allo **storage oggetti**. Sulla base della descrizione:

| Servizio | Tipo | Scopo |
|----------|------|-------|
| **Object Storage S3‑compatibile** (es. AWS S3 / MinIO / GCS) | Storage binario | Conservazione documenti sorgenti e documentazione generata, versione file, download sicuro |
| **Email provider** (ipotesi: SendGrid/Mailgun/SMTP) | Notifica (opzionale) | Notifiche su completamento job di generazione (se implementato in futuro) |

Poiché nel repository non sono presenti configurazioni (`.env`, `docker-compose`, codice) non è possibile indicare provider specifici o SDK utilizzati.

---

## 7. Infrastructure & Deployment

| Tecnologia / Servizio | Ruolo |
|-----------------------|-------|
| **Docker** | Containerizzazione di backend, worker, frontend e (eventualmente) servizi di supporto |
| **Docker Compose** o orchestratore (es. Kubernetes) | Esecuzione multi‑servizio in locale e deploy su ambienti gestiti |
| **Reverse Proxy / Load Balancer** (es. **Nginx** / ingress controller K8s) | Terminazione TLS, instradamento verso API e frontend |
| **Managed PostgreSQL** (es. Cloud SQL, RDS, Aurora Postgres‑compatibile) | Hosting DB in produzione con backup, replica e monitoring gestiti |
| **Object Storage gestito** (S3, GCS, Azure Blob) | Storage persistente dei file caricati e generati |

L’architettura cita *Cloud Run / GKE / equivalenti* come opzioni tipiche, ma il repository non contiene file di deploy (`Dockerfile`, `k8s manifests`, `cloudbuild.yaml`, ecc.), quindi la destinazione esatta non è deducibile.

---

## 8. Development & Build Tools

| Tool / Tecnologia | Ruolo |
|-------------------|-------|
| **Node.js toolchain** (`ts-node`, `tsc`) | Compilazione TypeScript e avvio applicazione (dev/prod) |
| **Bundler Frontend** (es. **Vite** o **Webpack**) | Build dell’app React (bundling, minification, code splitting) |
| **ESLint** | Linting e standard di stile per TS/JS |
| **Prettier** | Formattazione automatica del codice |
| **Husky** / **lint-staged** (opzionale) | Hook Git per enforcement lint/format su commit |
| **CI/CD** (GitHub Actions, GitLab CI, ecc.) | Pipeline di test, build, dockerizzazione e deploy |

Nel repository esiste solo la cartella `.github/`, ma senza visibilità sul contenuto non posso elencare job o workflow specifici.

---

## 9. Testing Framework

| Tecnologia | Ruolo |
|------------|-------|
| **Jest** | Testing unitario e di integrazione per backend e logica condivisa |
| **Supertest** (se Express) / **light-my-request** (se Fastify) | Test di integrazione sugli endpoint HTTP |
| **React Testing Library** | Test dei componenti React in modo user‑centric |
| **Playwright / Cypress** (opzionale) | End‑to‑end testing (flussi UI completi: caricamento documenti, avvio job, download risultati) |

Ancora, non essendo presenti file `package.json` o configurazioni di test non posso confermare strumenti specifici: quanto sopra è coerente con lo stack descritto nell’architettura.

---

## 10. Dependency Update Strategy

Poiché il repository non contiene strumenti automatizzati visibili (es. config Renovate/Dependabot) né documentazione specifica, la seguente strategia è **raccomandata** in coerenza con l’architettura:

- **Cadenza aggiornamenti:**
  - Verifica trimestrale delle versioni principali (Node, React, ORM, librerie core).
  - Aggiornamenti **mensili** per patch e minor version non breaking (semver).
- **Sicurezza:**
  - Abilitare strumenti automatici tipo **Dependabot** (GitHub) o **Renovate** per:
    - segnalare vulnerabilità note (advisories npm);
    - proporre PR automatiche con bump di versione.
  - Integrare nella pipeline CI uno scanner di vulnerabilità (es. `npm audit`, Snyk, Trivy per immagini Docker).
- **Policy:**
  - Nessun deploy in produzione con vulnerabilità di severità **HIGH/CRITICAL** non gestite.
  - Migrazioni del DB versionate e testate sempre in ambiente di staging prima del roll‑out in produzione.
- **Compatibilità:**
  - Mantenere backend su **Node LTS**.
  - Restare entro le versioni supportate di librerie critiche (React, ORM, JWT, bcrypt).

---

### Limiti dell’analisi attuale

- Il repository condiviso non contiene file di codice né manifest di dipendenze; quanto sopra è quindi basato sulla **Generated Architecture** fornita.
- Per avere un inventario 100% accurato del tech stack reale sarà necessario:
  - aggiungere al repository il codice applicativo o
  - condividere almeno file come `package.json`, `tsconfig.json`, `Dockerfile`, configurazioni CI/CD e migrazioni DB.

Se vuoi, al prossimo passo posso:

- proporti un **esempio di `package.json`** (backend e frontend) coerente con questa architettura;  
- oppure dettagliare uno **stack minimo raccomandato** (con nomi/versions esatti) da adottare nel tuo progetto demo.