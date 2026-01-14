# Tech Stack

## Portale Web per la Gestione dei Collaboratori Esterni

**Versione:** 1.0  
**Data:** Gennaio 2026

---

## 1. Overview

Stack tecnologico enterprise per applicazione web con focus su:
- **Semplicità**: Tecnologie consolidate e ben documentate
- **Sicurezza**: Framework con protezioni built-in
- **Manutenibilità**: Codice testabile e modulare
- **Scalabilità**: Architettura cloud-ready

---

## 2. Backend

### 2.1 Runtime & Framework

| Componente | Versione | Descrizione |
|------------|----------|-------------|
| **Java** | 17 LTS | Runtime principale, supporto a lungo termine |
| **Spring Boot** | 3.x | Framework per applicazioni enterprise |
| **Spring Security** | 6.x | Autenticazione e autorizzazione |
| **Spring Data JPA** | 3.x | Accesso dati con Hibernate |
| **Spring Mail** | 3.x | Invio email transazionali |

### 2.2 Librerie Principali

| Libreria | Uso |
|----------|-----|
| **Lombok** | Riduzione boilerplate (getter, setter, builder) |
| **MapStruct** | Mapping DTO ↔ Entity |
| **Validation API** | Validazione input (@Valid, @NotBlank) |
| **Jackson** | Serializzazione JSON |
| **SLF4J + Logback** | Logging |

### 2.3 Build & Dependency Management

| Tool | Versione | Descrizione |
|------|----------|-------------|
| **Maven** | 3.9+ | Build e dependency management |
| **JUnit 5** | 5.10+ | Testing framework |
| **Mockito** | 5.x | Mocking per unit test |
| **Testcontainers** | 1.19+ | Integration test con Docker |

---

## 3. Frontend

### 3.1 Templating & UI

| Componente | Versione | Descrizione |
|------------|----------|-------------|
| **Thymeleaf** | 3.x | Template engine server-side |
| **Bootstrap** | 5.3 | CSS framework responsive |
| **Font Awesome** | 6.x | Icone vettoriali |

### 3.2 JavaScript

| Libreria | Uso |
|----------|-----|
| **Vanilla JS** | Logica applicativa base |
| **Fetch API** | Chiamate REST asincrone |
| **SweetAlert2** | Dialoghi e notifiche |
| **DataTables** | Tabelle interattive con paginazione |

> **Nota POC**: Per il POC si usa JavaScript vanilla. Vue.js/React considerati per evoluzioni future.

---

## 4. Database

### 4.1 Produzione

| Componente | Versione | Descrizione |
|------------|----------|-------------|
| **PostgreSQL** | 15+ | Database relazionale principale |
| **Flyway** | 9.x | Migrations database |

### 4.2 Sviluppo/Test

| Componente | Uso |
|------------|-----|
| **H2 Database** | Database in-memory per test |
| **Docker PostgreSQL** | Sviluppo locale |

### 4.3 Schema Versioning

```
src/main/resources/db/migration/
├── V001__create_users.sql
├── V002__create_companies.sql
├── V003__create_accreditation.sql
├── V004__create_work_orders.sql
└── V005__create_invoices.sql
```

---

## 5. Infrastruttura

### 5.1 Containerization

| Componente | Uso |
|------------|-----|
| **Docker** | Container per applicazione |
| **Docker Compose** | Orchestrazione sviluppo locale |

### 5.2 Cloud Platform (GCP)

| Servizio | Uso |
|----------|-----|
| **Cloud Run** | Hosting applicazione containerizzata |
| **Cloud SQL** | PostgreSQL managed |
| **Cloud Storage** | Storage file (CV, fatture) |
| **Secret Manager** | Gestione credenziali |
| **Cloud Logging** | Aggregazione log |

### 5.3 CI/CD

| Tool | Uso |
|------|-----|
| **GitHub Actions** | Pipeline CI/CD |
| **Docker Registry** | Container registry (GCR o Artifact Registry) |

---

## 6. Sicurezza

### 6.1 Autenticazione

| Metodo | Descrizione |
|--------|-------------|
| **Session-based** | Cookie HTTP-only per web UI |
| **BCrypt** | Hashing password |
| **CSRF Token** | Protezione cross-site request forgery |

### 6.2 Autorizzazione

| Meccanismo | Descrizione |
|------------|-------------|
| **RBAC** | Role-Based Access Control |
| **@PreAuthorize** | Autorizzazione method-level |
| **URL Security** | Pattern-based URL protection |

### 6.3 Protezioni

| Protezione | Implementazione |
|------------|-----------------|
| **XSS** | Thymeleaf auto-escaping |
| **SQL Injection** | JPA/Hibernate parameterized queries |
| **CORS** | Configurazione whitelist origin |
| **Rate Limiting** | Bucket4j o Spring Cloud Gateway |

---

## 7. Monitoring & Observability

### 7.1 Logging

| Componente | Uso |
|------------|-----|
| **SLF4J** | API logging |
| **Logback** | Implementazione logging |
| **JSON Layout** | Formato log per Cloud Logging |

### 7.2 Metriche (Futuro)

| Componente | Uso |
|------------|-----|
| **Spring Actuator** | Health checks, metrics |
| **Micrometer** | Metrics collection |
| **Prometheus** | Metrics aggregation |

---

## 8. Sviluppo Locale

### 8.1 Requisiti

| Tool | Versione |
|------|----------|
| Java JDK | 17+ |
| Maven | 3.9+ |
| Docker | 24+ |
| Docker Compose | 2.x |
| IDE | IntelliJ IDEA / VS Code |

### 8.2 Setup Rapido

```bash
# Clone repository
git clone https://github.com/company/collaboratori-portal.git
cd collaboratori-portal

# Avvia database
docker-compose up -d db

# Avvia applicazione
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Oppure tutto con Docker
docker-compose up
```

### 8.3 Environment Variables

```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/portal
DATABASE_USERNAME=portal
DATABASE_PASSWORD=portal

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USERNAME=xxx
SMTP_PASSWORD=xxx

# Storage
UPLOAD_PATH=/tmp/uploads
MAX_FILE_SIZE=10MB
```

---

## 9. Dipendenze (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-mail</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Database -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    
    <!-- Utilities -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## 10. Versioning & Compatibilità

| Componente | Versione Minima | Note |
|------------|-----------------|------|
| Java | 17 | LTS fino 2029 |
| Spring Boot | 3.0 | Richiede Java 17+ |
| PostgreSQL | 13 | Supporto fino 2025+ |
| Docker | 20.10 | Compose V2 |

---

## 11. Evoluzione Tecnologica

### 11.1 POC → MVP

| Area | POC | MVP |
|------|-----|-----|
| Auth | Session-based | + SSO (OAuth2/OIDC) |
| Storage | Local filesystem | Cloud Storage (S3/GCS) |
| Email | SMTP diretto | + Template engine |
| Search | SQL LIKE | Elasticsearch |

### 11.2 MVP → Produzione

| Area | MVP | Produzione |
|------|-----|------------|
| Frontend | Thymeleaf | + Vue.js/React SPA |
| Cache | Nessuna | Redis |
| Queue | Nessuna | RabbitMQ/Cloud Pub/Sub |
| API | REST | + GraphQL opzionale |
