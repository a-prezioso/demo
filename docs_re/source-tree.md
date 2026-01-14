# Source Tree

## Portale Web per la Gestione dei Collaboratori Esterni

**Versione:** 1.0  
**Data:** Gennaio 2026

---

## 1. Project Root Structure

```
collaboratori-portal/
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yml              # Continuous Integration
│       ├── deploy-dev.yml      # Deploy to dev
│       └── deploy-prod.yml     # Deploy to production
│
├── docker/                     # Docker configuration
│   ├── Dockerfile              # Production image
│   ├── Dockerfile.dev          # Development image
│   └── docker-compose.yml      # Local development stack
│
├── docs/                       # Documentation
│   ├── prd.md                  # Product Requirements Document
│   ├── architecture.md         # Architecture decisions
│   ├── tech-stack.md           # Technology stack
│   ├── coding-standards.md     # Coding conventions
│   └── source-tree.md          # This file
│
├── src/                        # Source code
│   ├── main/
│   │   ├── java/               # Java source files
│   │   └── resources/          # Configuration & templates
│   └── test/
│       └── java/               # Test source files
│
├── pom.xml                     # Maven configuration
├── README.md                   # Project overview
└── .gitignore                  # Git ignore rules
```

---

## 2. Java Source Structure

```
src/main/java/com/elite/portal/
│
├── PortalApplication.java          # Spring Boot main class
│
├── core/                           # Core domain (shared)
│   │
│   ├── config/                     # Spring configurations
│   │   ├── SecurityConfig.java         # Security configuration
│   │   ├── WebMvcConfig.java            # MVC configuration
│   │   ├── MailConfig.java              # Email configuration
│   │   └── StorageConfig.java           # File storage config
│   │
│   ├── entity/                     # Core entities
│   │   ├── User.java                    # User entity
│   │   ├── Company.java                 # Company entity
│   │   ├── Role.java                    # Role enum
│   │   └── BaseEntity.java              # Base entity (id, timestamps)
│   │
│   ├── repository/                 # Core repositories
│   │   ├── UserRepository.java
│   │   └── CompanyRepository.java
│   │
│   ├── security/                   # Security components
│   │   ├── UserDetailsServiceImpl.java  # User details service
│   │   ├── JwtTokenProvider.java        # JWT token handling
│   │   └── AuthenticationController.java # Login/logout
│   │
│   └── exception/                  # Global exception handling
│       ├── GlobalExceptionHandler.java
│       ├── ResourceNotFoundException.java
│       └── ValidationException.java
│
├── modules/                        # Feature modules
│   │
│   ├── accreditation/              # Module A: Accreditation
│   │   ├── controller/
│   │   │   └── AccreditationController.java
│   │   ├── service/
│   │   │   ├── AccreditationService.java
│   │   │   └── AccreditationStateService.java
│   │   ├── repository/
│   │   │   └── AccreditationRequestRepository.java
│   │   ├── entity/
│   │   │   ├── AccreditationRequest.java
│   │   │   └── AccreditationStatus.java
│   │   └── dto/
│   │       ├── AccreditationDto.java
│   │       ├── SubmitRequestDto.java
│   │       └── ApprovalDto.java
│   │
│   ├── collaborator/               # Module B: Collaborators
│   │   ├── controller/
│   │   │   └── CollaboratorController.java
│   │   ├── service/
│   │   │   ├── CollaboratorService.java
│   │   │   └── InvitationService.java
│   │   ├── repository/
│   │   │   └── CollaboratorRepository.java
│   │   ├── entity/
│   │   │   └── Collaborator.java
│   │   └── dto/
│   │       ├── CollaboratorDto.java
│   │       └── InviteCollaboratorDto.java
│   │
│   ├── cv/                         # Module C: CV & Skills
│   │   ├── controller/
│   │   │   └── CvController.java
│   │   ├── service/
│   │   │   ├── CvService.java
│   │   │   └── SkillService.java
│   │   ├── repository/
│   │   │   ├── DocumentRepository.java
│   │   │   └── SkillRepository.java
│   │   ├── entity/
│   │   │   ├── Document.java
│   │   │   ├── DocumentType.java
│   │   │   └── Skill.java
│   │   └── dto/
│   │       ├── CvUploadDto.java
│   │       └── SkillDto.java
│   │
│   ├── workorder/                  # Module D: Work Orders
│   │   ├── controller/
│   │   │   └── WorkOrderController.java
│   │   ├── service/
│   │   │   ├── WorkOrderService.java
│   │   │   └── WorkOrderStateService.java
│   │   ├── repository/
│   │   │   └── WorkOrderRepository.java
│   │   ├── entity/
│   │   │   ├── WorkOrder.java
│   │   │   └── WorkOrderStatus.java
│   │   └── dto/
│   │       ├── WorkOrderDto.java
│   │       ├── CreateWorkOrderDto.java
│   │       └── AssignWorkOrderDto.java
│   │
│   └── invoice/                    # Module E: Invoices
│       ├── controller/
│       │   └── InvoiceController.java
│       ├── service/
│       │   ├── InvoiceService.java
│       │   └── InvoiceVerificationService.java
│       ├── repository/
│       │   └── InvoiceRepository.java
│       ├── entity/
│       │   ├── Invoice.java
│       │   └── InvoiceStatus.java
│       └── dto/
│           ├── InvoiceDto.java
│           ├── UploadInvoiceDto.java
│           └── VerifyInvoiceDto.java
│
└── shared/                         # Shared utilities
    │
    ├── email/                      # Email service
    │   ├── EmailService.java
    │   └── EmailTemplateService.java
    │
    ├── storage/                    # File storage
    │   ├── StorageService.java
    │   └── LocalStorageService.java
    │
    ├── audit/                      # Audit logging
    │   ├── AuditService.java
    │   ├── AuditLog.java
    │   └── AuditLogRepository.java
    │
    └── util/                       # Utilities
        ├── DateUtils.java
        └── FileUtils.java
```

---

## 3. Resources Structure

```
src/main/resources/
│
├── application.yml                 # Main configuration
├── application-dev.yml             # Development profile
├── application-prod.yml            # Production profile
│
├── db/
│   └── migration/                  # Flyway migrations
│       ├── V001__create_users.sql
│       ├── V002__create_companies.sql
│       ├── V003__create_accreditation.sql
│       ├── V004__create_collaborators.sql
│       ├── V005__create_documents.sql
│       ├── V006__create_skills.sql
│       ├── V007__create_work_orders.sql
│       ├── V008__create_invoices.sql
│       └── V009__create_audit_log.sql
│
├── static/                         # Static assets
│   ├── css/
│   │   ├── main.css                # Custom styles
│   │   └── vendor/                 # Bootstrap, etc.
│   ├── js/
│   │   ├── main.js                 # Main JavaScript
│   │   ├── modules/
│   │   │   ├── accreditation.js
│   │   │   ├── workorder.js
│   │   │   └── invoice.js
│   │   └── vendor/                 # Libraries
│   └── images/
│       └── logo.png
│
├── templates/                      # Thymeleaf templates
│   │
│   ├── layout/                     # Layout templates
│   │   ├── base.html               # Base layout
│   │   └── fragments/
│   │       ├── header.html
│   │       ├── sidebar.html
│   │       ├── footer.html
│   │       └── scripts.html
│   │
│   ├── auth/                       # Authentication pages
│   │   ├── login.html
│   │   ├── register.html
│   │   └── forgot-password.html
│   │
│   ├── external/                   # External user area
│   │   ├── dashboard.html
│   │   ├── profile/
│   │   │   ├── view.html
│   │   │   └── edit.html
│   │   ├── collaborators/
│   │   │   ├── list.html
│   │   │   └── invite.html
│   │   ├── workorders/
│   │   │   ├── list.html
│   │   │   └── detail.html
│   │   └── invoices/
│   │       ├── list.html
│   │       └── upload.html
│   │
│   ├── backoffice/                 # IT Operator area
│   │   ├── dashboard.html
│   │   ├── accreditation/
│   │   │   ├── list.html
│   │   │   └── detail.html
│   │   ├── resources/
│   │   │   ├── list.html
│   │   │   └── detail.html
│   │   ├── workorders/
│   │   │   ├── list.html
│   │   │   ├── create.html
│   │   │   └── detail.html
│   │   └── invoices/
│   │       ├── list.html
│   │       └── verify.html
│   │
│   ├── admin/                      # System admin area
│   │   ├── users/
│   │   │   ├── list.html
│   │   │   └── edit.html
│   │   ├── config.html
│   │   └── audit-log.html
│   │
│   └── error/                      # Error pages
│       ├── 400.html
│       ├── 403.html
│       ├── 404.html
│       └── 500.html
│
└── mail/                           # Email templates
    ├── welcome.html
    ├── accreditation-submitted.html
    ├── accreditation-approved.html
    ├── accreditation-rejected.html
    ├── workorder-assigned.html
    └── invoice-status.html
```

---

## 4. Test Structure

```
src/test/java/com/elite/portal/
│
├── PortalApplicationTests.java     # Application context test
│
├── core/
│   ├── security/
│   │   └── SecurityConfigTest.java
│   └── repository/
│       └── UserRepositoryTest.java
│
├── modules/
│   │
│   ├── accreditation/
│   │   ├── controller/
│   │   │   └── AccreditationControllerTest.java
│   │   ├── service/
│   │   │   └── AccreditationServiceTest.java
│   │   └── integration/
│   │       └── AccreditationFlowIntegrationTest.java
│   │
│   ├── collaborator/
│   │   ├── service/
│   │   │   └── CollaboratorServiceTest.java
│   │   └── integration/
│   │       └── CollaboratorIntegrationTest.java
│   │
│   ├── cv/
│   │   └── service/
│   │       └── CvServiceTest.java
│   │
│   ├── workorder/
│   │   ├── service/
│   │   │   └── WorkOrderServiceTest.java
│   │   └── integration/
│   │       └── WorkOrderFlowIntegrationTest.java
│   │
│   └── invoice/
│       └── service/
│           └── InvoiceServiceTest.java
│
└── shared/
    ├── email/
    │   └── EmailServiceTest.java
    └── storage/
        └── StorageServiceTest.java
```

---

## 5. Configuration Files

```
project-root/
│
├── pom.xml                         # Maven configuration
├── .mvn/
│   └── wrapper/
│       └── maven-wrapper.properties
│
├── docker/
│   ├── Dockerfile                  # Multi-stage build
│   ├── docker-compose.yml          # Development stack
│   └── docker-compose.prod.yml     # Production stack
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Build & test on PR
│       ├── deploy-dev.yml          # Auto-deploy to dev
│       └── deploy-prod.yml         # Manual deploy to prod
│
├── .gitignore                      # Git ignore patterns
├── .editorconfig                   # Editor configuration
├── lombok.config                   # Lombok configuration
│
└── README.md                       # Project documentation
```

---

## 6. Key Files Description

| File | Description |
|------|-------------|
| `PortalApplication.java` | Spring Boot entry point |
| `SecurityConfig.java` | Security rules, CORS, CSRF |
| `User.java` | Core user entity with roles |
| `AccreditationService.java` | Business logic for accreditation |
| `WorkOrderController.java` | REST API for work orders |
| `application.yml` | Centralized configuration |
| `base.html` | Master layout template |
| `V001__create_users.sql` | Initial database schema |

---

## 7. Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `core/` | Authentication, users, companies, exceptions |
| `accreditation/` | Registration, approval workflow |
| `collaborator/` | Company collaborator management |
| `cv/` | Documents, CV upload, skills |
| `workorder/` | OdL creation, assignment, tracking |
| `invoice/` | Invoice upload, verification |
| `shared/` | Email, storage, audit, utilities |

---

## 8. Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Controller | `{Module}Controller` | `AccreditationController` |
| Service | `{Module}Service` | `AccreditationService` |
| Repository | `{Entity}Repository` | `AccreditationRequestRepository` |
| Entity | `{Name}` | `AccreditationRequest` |
| DTO | `{Name}Dto` | `AccreditationDto` |
| Status Enum | `{Entity}Status` | `AccreditationStatus` |
| Migration | `V{NNN}__{description}.sql` | `V003__create_accreditation.sql` |
| Template | `{page}.html` in module folder | `templates/accreditation/list.html` |
