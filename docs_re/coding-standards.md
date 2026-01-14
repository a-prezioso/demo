# Coding Standards

## Portale Web per la Gestione dei Collaboratori Esterni

**Versione:** 1.0  
**Data:** Gennaio 2026

---

## 1. Convenzioni Generali

### 1.1 Lingua

- **Codice**: Inglese (nomi classi, metodi, variabili)
- **Commenti**: Italiano o Inglese (consistente nel progetto)
- **Documentazione**: Italiano (requisiti, user stories)
- **UI Labels**: Italiano

### 1.2 Formato

- **Indentazione**: 4 spazi (no tabs)
- **Line length**: Max 120 caratteri
- **Encoding**: UTF-8
- **Line endings**: LF (Unix-style)

---

## 2. Java / Spring Boot

### 2.1 Naming Conventions

| Tipo | Convenzione | Esempio |
|------|-------------|---------|
| Classi | PascalCase | `AccreditationService` |
| Interfacce | PascalCase | `UserRepository` |
| Metodi | camelCase | `approveRequest()` |
| Variabili | camelCase | `isApproved` |
| Costanti | UPPER_SNAKE | `MAX_FILE_SIZE` |
| Package | lowercase | `com.elite.portal.modules.accreditation` |
| Enum values | UPPER_SNAKE | `UNDER_REVIEW` |

### 2.2 Struttura Classi

```java
package com.elite.portal.modules.accreditation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service per la gestione delle richieste di accreditamento.
 * 
 * @author Elite Portal Team
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AccreditationService {
    
    // 1. Dependencies (inject via constructor)
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // 2. Public methods
    @Transactional
    public void approveRequest(Long requestId, String operatorNote) {
        log.info("Approving accreditation request: {}", requestId);
        // Implementation
    }
    
    // 3. Private helper methods
    private void validateRequest(AccreditationRequest request) {
        // Validation logic
    }
}
```

### 2.3 Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/accreditation")
@RequiredArgsConstructor
@Tag(name = "Accreditation", description = "API per accreditamento")
public class AccreditationController {

    private final AccreditationService service;

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('IT_OPERATOR')")
    @Operation(summary = "Approva richiesta accreditamento")
    public ResponseEntity<AccreditationDto> approve(
            @PathVariable Long id,
            @RequestBody @Valid ApprovalRequest request) {
        return ResponseEntity.ok(service.approve(id, request));
    }
}
```

### 2.4 Entity Pattern

```java
@Entity
@Table(name = "accreditation_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccreditationRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AccreditationStatus status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

### 2.5 Repository Pattern

```java
public interface AccreditationRequestRepository 
        extends JpaRepository<AccreditationRequest, Long> {
    
    List<AccreditationRequest> findByStatus(AccreditationStatus status);
    
    @Query("SELECT r FROM AccreditationRequest r WHERE r.user.company.id = :companyId")
    List<AccreditationRequest> findByCompanyId(@Param("companyId") Long companyId);
    
    Optional<AccreditationRequest> findByUserEmail(String email);
}
```

### 2.6 DTO Pattern

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccreditationDto {
    
    private Long id;
    private String userEmail;
    private String userName;
    private AccreditationStatus status;
    private LocalDateTime submittedAt;
    
    // Factory method for mapping
    public static AccreditationDto from(AccreditationRequest entity) {
        return AccreditationDto.builder()
                .id(entity.getId())
                .userEmail(entity.getUser().getEmail())
                .userName(entity.getUser().getFullName())
                .status(entity.getStatus())
                .submittedAt(entity.getCreatedAt())
                .build();
    }
}
```

---

## 3. Database / SQL

### 3.1 Naming Conventions

| Tipo | Convenzione | Esempio |
|------|-------------|---------|
| Tabelle | snake_case, plurale | `accreditation_requests` |
| Colonne | snake_case | `created_at` |
| Primary Key | `id` | `id` |
| Foreign Key | `{table}_id` | `user_id` |
| Index | `idx_{table}_{columns}` | `idx_requests_status` |
| Constraint | `{type}_{table}_{column}` | `fk_requests_user` |

### 3.2 Migration Files

```sql
-- V001__create_accreditation_tables.sql

CREATE TABLE accreditation_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    operator_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_requests_status ON accreditation_requests(status);
CREATE INDEX idx_requests_user ON accreditation_requests(user_id);
```

---

## 4. REST API

### 4.1 URL Conventions

- Risorse al plurale: `/users`, `/work-orders`
- Nesting per relazioni: `/companies/{id}/collaborators`
- Azioni custom: `/work-orders/{id}/send` (POST)
- Query params per filtri: `/work-orders?status=SENT&page=0`

### 4.2 Response Format

```json
// Success (single)
{
    "id": 123,
    "email": "user@example.com",
    "status": "APPROVED"
}

// Success (list)
{
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
}

// Error
{
    "timestamp": "2026-01-14T10:30:00",
    "status": 400,
    "error": "Bad Request",
    "message": "Email already exists",
    "path": "/api/v1/users"
}
```

### 4.3 HTTP Status Codes

| Codice | Uso |
|--------|-----|
| 200 | OK - Richiesta completata |
| 201 | Created - Risorsa creata |
| 204 | No Content - Cancellazione riuscita |
| 400 | Bad Request - Validazione fallita |
| 401 | Unauthorized - Non autenticato |
| 403 | Forbidden - Non autorizzato |
| 404 | Not Found - Risorsa non trovata |
| 409 | Conflict - Stato inconsistente |
| 500 | Internal Server Error - Errore server |

---

## 5. Frontend (Thymeleaf + JavaScript)

### 5.1 Template Structure

```
templates/
├── layout/
│   ├── base.html          # Layout principale
│   └── fragments/
│       ├── header.html
│       ├── sidebar.html
│       └── footer.html
├── accreditation/
│   ├── list.html
│   ├── detail.html
│   └── form.html
└── shared/
    ├── error.html
    └── success.html
```

### 5.2 JavaScript Conventions

```javascript
// Module pattern
const AccreditationModule = (function() {
    'use strict';
    
    // Private variables
    const API_BASE = '/api/v1/accreditation';
    
    // Private methods
    function handleError(error) {
        console.error('Error:', error);
        showToast('Errore durante l\'operazione', 'error');
    }
    
    // Public API
    return {
        approve: async function(requestId) {
            try {
                const response = await fetch(`${API_BASE}/${requestId}/approve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken()
                    }
                });
                if (!response.ok) throw new Error('Request failed');
                showToast('Richiesta approvata', 'success');
                location.reload();
            } catch (error) {
                handleError(error);
            }
        }
    };
})();
```

---

## 6. Testing

### 6.1 Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class AccreditationServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private EmailService emailService;
    
    @InjectMocks
    private AccreditationService service;
    
    @Test
    @DisplayName("Should approve valid request")
    void approveRequest_ValidRequest_ShouldSucceed() {
        // Given
        var request = createTestRequest(AccreditationStatus.SUBMITTED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(request.getUser()));
        
        // When
        service.approveRequest(1L, "Approved");
        
        // Then
        assertEquals(AccreditationStatus.APPROVED, request.getStatus());
        verify(emailService).sendApprovalNotification(any());
    }
}
```

### 6.2 Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AccreditationControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser(roles = "IT_OPERATOR")
    void approveRequest_AsOperator_ShouldSucceed() throws Exception {
        mockMvc.perform(post("/api/v1/accreditation/1/approve")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"note\": \"Approved\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }
}
```

---

## 7. Logging

### 7.1 Log Levels

| Level | Uso |
|-------|-----|
| ERROR | Errori che richiedono intervento |
| WARN | Situazioni anomale ma gestite |
| INFO | Eventi significativi di business |
| DEBUG | Dettagli per troubleshooting |
| TRACE | Dettagli estremi (solo sviluppo) |

### 7.2 Log Format

```java
// Good
log.info("Approving accreditation request: {} by operator: {}", requestId, operatorEmail);
log.error("Failed to send email to {}: {}", userEmail, e.getMessage(), e);

// Bad
log.info("Request approved");  // Mancano dettagli
log.info("Request " + requestId + " approved");  // Usa concatenazione
```

---

## 8. Security Best Practices

### 8.1 Input Validation

```java
@PostMapping
public ResponseEntity<?> create(@RequestBody @Valid CreateUserRequest request) {
    // @Valid triggers automatic validation
}

public record CreateUserRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank @Size(max = 100) String fullName
) {}
```

### 8.2 Authorization

```java
@PreAuthorize("hasRole('IT_OPERATOR')")
public void approveRequest(Long id) { }

@PreAuthorize("hasRole('EXTERNAL_OWNER') and #userId == authentication.principal.id")
public void updateProfile(Long userId, ProfileDto dto) { }
```

---

## 9. Git Workflow

### 9.1 Branch Naming

- `main` - Produzione stabile
- `develop` - Sviluppo integrato
- `feature/ACC-123-descrizione` - Feature branch
- `fix/ACC-456-descrizione` - Bug fix
- `hotfix/ACC-789-descrizione` - Hotfix urgente

### 9.2 Commit Messages

```
feat(accreditation): add approval workflow

- Implement approve/reject endpoints
- Add email notifications
- Add audit logging

Closes #123
```

Formato: `type(scope): message`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
