# Architecture Document

## Portale Web per la Gestione dei Collaboratori Esterni

**Versione:** 1.0  
**Data:** Gennaio 2026

---

## 1. Panoramica del Sistema

Il portale web è un'applicazione enterprise per la gestione dei collaboratori esterni di un'azienda IT. Il sistema supporta:

- Accreditamento di professionisti e aziende fornitrici
- Gestione CV e competenze
- Ordini di Lavoro (OdL)
- Gestione documentale fatture

### 1.1 Contesto di Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    COLLABORATORI ESTERNI                         │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Professionista  │    │  Azienda        │                     │
│  │ Esterno         │    │  Fornitrice     │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                      │                               │
│           └──────────┬───────────┘                               │
│                      │                                           │
│                      ▼                                           │
│           ┌──────────────────┐                                   │
│           │   PORTALE WEB    │◄─────────┐                       │
│           │ (Browser/Mobile) │          │                        │
│           └────────┬─────────┘          │                        │
│                    │                    │                        │
└────────────────────│────────────────────│────────────────────────┘
                     │                    │
                     ▼                    │
         ┌───────────────────────┐   ┌────┴─────────────┐
         │    APPLICATION        │   │   AZIENDA IT     │
         │       SERVER          │   │  (IT_OPERATOR)   │
         │  ┌─────────────────┐  │   │  (SYS_ADMIN)     │
         │  │   REST APIs     │  │   └──────────────────┘
         │  │   + Web UI      │  │
         │  └─────────────────┘  │
         └──────────┬────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌──────────┐
   │Database │ │  File   │ │  Email   │
   │PostgreSQL│ │ Storage │ │  SMTP    │
   └─────────┘ └─────────┘ └──────────┘
```

---

## 2. Architettura del Sistema

### 2.1 Pattern Architetturale

- **Layered Architecture (MVC)**: Separazione tra Controller, Service, Repository
- **Domain-Driven Design (DDD)**: Moduli organizzati per dominio funzionale
- **REST API**: Interfacce HTTP/JSON per frontend e integrazioni

### 2.2 Stack Tecnologico

| Layer | Tecnologia |
|-------|------------|
| Frontend | Thymeleaf + Bootstrap 5 + JavaScript |
| Backend | Java 17 + Spring Boot 3.x |
| Database | PostgreSQL 15 |
| Security | Spring Security (RBAC) |
| ORM | Hibernate / JPA |
| Build | Maven |
| Deploy | Docker + Cloud Run |

### 2.3 Struttura Moduli

```
src/main/java/com/elite/portal/
├── core/                    # Core entities, config, security
│   ├── config/              # Spring configurations
│   ├── entity/              # Core domain entities
│   ├── repository/          # JPA repositories
│   └── security/            # Authentication, authorization
│
├── modules/
│   ├── accreditation/       # Modulo A: Registrazione e Accreditamento
│   │   ├── controller/
│   │   ├── service/
│   │   ├── dto/
│   │   └── entity/
│   │
│   ├── collaborator/        # Modulo B: Gestione Collaboratori
│   │   ├── controller/
│   │   ├── service/
│   │   └── dto/
│   │
│   ├── cv/                  # Modulo C: CV e Competenze
│   │   ├── controller/
│   │   ├── service/
│   │   └── entity/
│   │
│   ├── odl/                 # Modulo D: Ordini di Lavoro
│   │   ├── controller/
│   │   ├── service/
│   │   ├── dto/
│   │   └── entity/
│   │
│   └── invoice/             # Modulo E: Fatture
│       ├── controller/
│       ├── service/
│       └── entity/
│
└── shared/                  # Utilities e componenti condivisi
    ├── email/               # Email service
    ├── storage/             # File storage service
    └── audit/               # Audit logging
```

---

## 3. Decisioni Architetturali (ADR)

### ADR-001: Autenticazione e Autorizzazione

**Contesto:** Necessità di gestire 4 ruoli distinti con permessi diversi.

**Decisione:** Utilizzo di Spring Security con RBAC (Role-Based Access Control).

**Conseguenze:**
- Ogni endpoint è protetto con `@PreAuthorize`
- Ruoli salvati in database, associati a utenti
- JWT token per sessioni stateless (opzionale per API)

### ADR-002: Gestione Stati con State Machine

**Contesto:** Entità (Accreditamento, OdL, Fatture) hanno stati ben definiti con transizioni specifiche.

**Decisione:** Implementazione di una State Machine semplificata per gestire le transizioni.

**Conseguenze:**
- Ogni entità ha un campo `status` con enum dedicato
- Service layer valida le transizioni ammesse
- Log di tutte le transizioni per audit

### ADR-003: Storage Documenti

**Contesto:** Upload di CV, fatture, allegati OdL.

**Decisione:** Storage su filesystem locale con path segregato per tenant (POC). Migrazione a cloud storage (S3/GCS) in produzione.

**Conseguenze:**
- Whitelist di estensioni (PDF, DOCX, PNG, JPG)
- Size limit configurabile (default 10MB)
- Path strutturato: `/uploads/{type}/{userId}/{filename}`

### ADR-004: Notifiche Email

**Contesto:** Notifiche per registrazione, approvazione, assegnazione OdL.

**Decisione:** Utilizzo di Spring Mail con template Thymeleaf.

**Conseguenze:**
- Template email configurabili
- SMTP configurabile via environment variables
- Log di tutte le email inviate

---

## 4. Sicurezza

### 4.1 Autenticazione

- Login con email/password
- Password hashata con BCrypt
- Sessione gestita con cookie HTTP-only

### 4.2 Autorizzazione (RBAC)

| Ruolo | Permessi |
|-------|----------|
| `EXTERNAL_OWNER` | Gestione proprio profilo, CV, visualizzazione OdL assegnati, upload fatture |
| `EXTERNAL_COLLABORATOR` | Gestione proprio profilo/CV, visualizzazione OdL assegnati |
| `IT_OPERATOR` | Gestione accreditamenti, creazione OdL, verifica fatture, ricerca CV |
| `SYS_ADMIN` | Gestione utenti, configurazioni, audit log |

### 4.3 Protezioni

- CSRF protection (Thymeleaf + Spring Security)
- XSS prevention (escaping automatico)
- SQL Injection prevention (JPA/Hibernate)
- Rate limiting sugli endpoint sensibili

---

## 5. Database Schema

### 5.1 Entità Principali

```
┌─────────────────┐     ┌─────────────────┐
│     User        │     │    Company      │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ email           │     │ name            │
│ password_hash   │     │ vat_number      │
│ role            │     │ status          │
│ company_id (FK) │────►│ owner_id (FK)   │
│ status          │     │ created_at      │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   WorkOrder     │     │    Invoice      │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ title           │     │ number          │
│ description     │     │ date            │
│ assignee_id (FK)│     │ amount          │
│ status          │     │ work_order_id   │
│ created_by (FK) │     │ uploaded_by (FK)│
│ created_at      │     │ status          │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   Document      │     │   AuditLog      │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ type (CV/NDA..) │     │ action          │
│ file_path       │     │ entity_type     │
│ owner_id (FK)   │     │ entity_id       │
│ uploaded_at     │     │ user_id         │
└─────────────────┘     │ timestamp       │
                        └─────────────────┘
```

---

## 6. API Design

### 6.1 Convenzioni REST

- Base path: `/api/v1`
- Formato: JSON
- Autenticazione: Session cookie o Bearer token
- Paginazione: `?page=0&size=20`

### 6.2 Endpoints Principali

```
# Accreditamento
POST   /api/v1/accreditation/register
POST   /api/v1/accreditation/submit
GET    /api/v1/accreditation/requests      (IT_OPERATOR)
POST   /api/v1/accreditation/{id}/approve  (IT_OPERATOR)
POST   /api/v1/accreditation/{id}/reject   (IT_OPERATOR)

# Collaboratori
POST   /api/v1/collaborators
GET    /api/v1/collaborators
PUT    /api/v1/collaborators/{id}

# CV e Competenze
POST   /api/v1/cv/upload
GET    /api/v1/cv/{userId}
GET    /api/v1/skills/search

# Ordini di Lavoro
POST   /api/v1/work-orders              (IT_OPERATOR)
GET    /api/v1/work-orders
POST   /api/v1/work-orders/{id}/send    (IT_OPERATOR)
POST   /api/v1/work-orders/{id}/ack     (EXTERNAL)

# Fatture
POST   /api/v1/invoices/upload
GET    /api/v1/invoices
POST   /api/v1/invoices/{id}/accept     (IT_OPERATOR)
POST   /api/v1/invoices/{id}/reject     (IT_OPERATOR)
```

---

## 7. Deployment

### 7.1 Ambienti

| Ambiente | Descrizione |
|----------|-------------|
| Local | Docker Compose per sviluppo |
| Dev | Cloud Run (GCP) per test |
| Prod | Cloud Run (GCP) con Cloud SQL |

### 7.2 Docker Compose (Sviluppo)

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - DATABASE_URL=jdbc:postgresql://db:5432/portal
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=portal
      - POSTGRES_USER=portal
      - POSTGRES_PASSWORD=portal
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 8. Monitoraggio e Logging

### 8.1 Logging

- SLF4J + Logback
- Log level configurabile per ambiente
- Log strutturati in JSON per Cloud Logging

### 8.2 Audit

Tutte le azioni sensibili sono tracciate:
- Approvazione/rigetto accreditamenti
- Creazione/invio OdL
- Verifica fatture
- Login/logout
- Download documenti

---

## 9. Evoluzione Futura

| Fase | Funzionalità |
|------|--------------|
| POC | Flusso base end-to-end |
| MVP | SSO, Notifiche push, Dashboard analytics |
| V2 | Integrazione ERP, Firma digitale, Mobile app |
