# Standard di Codifica - demo

**Versione:** 1.0  
**Data:** 17/01/2026  
**Autore:** DEV Agent  

---

## 1. Introduzione

Questo documento definisce gli standard di codifica per il progetto **demo**, allineati all’architettura definita (Node.js, React, PostgreSQL, TypeScript opzionale) e pensati per garantire consistenza, leggibilità e manutenibilità del codice front-end e back-end.

> Nota: il repository attuale contiene solo cartelle `.github` e `docs_re`, quindi non ci sono ancora pattern “di fatto” nel codice. Gli standard sotto sono quindi **proposti** per guidare lo sviluppo futuro in coerenza con l’architettura.

---

## 2. Standard Generali

### 2.1. Linguaggi e Versioni

- **Backend**
  - Node.js LTS (>= 18)
  - TypeScript (raccomandato) o JavaScript ES2020+
- **Frontend**
  - React (>= 18)
  - TypeScript (raccomandato)
- **Database**
  - PostgreSQL 14+

### 2.2. Formattazione

Si utilizza **Prettier** + **ESLint** per garantire formattazione coerente:

- **Indentazione:** 2 spazi (no tabs)
- **Max line length:** 100 caratteri per JS/TS/TSX
- **Encoding:** UTF-8
- **Fine riga:** `LF` (Unix)
- **Punto e virgola:** obbligatorio
- **Virgolette:**
  - Singole `'` in JS/TS
  - Backtick \` \` per template string
- **Imports:**
  - Nessun import wildcard (`import * as ...`) se non strettamente necessario
  - Ordine:
    1. Moduli built-in Node (`fs`, `path`, …)
    2. Moduli di terze parti (`express`, `react`, …)
    3. Moduli interni (ordinati per path)
  - Una riga vuota tra gruppi

Esempio `.prettierrc`:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 3. Convenzioni di Nomenclatura

### 3.1. Backend (Node.js / TypeScript)

#### 3.1.1. File e cartelle

Struttura suggerita:

```
backend/
  src/
    api/                // layer Application (routes/controller)
    modules/
      projects/
        project.controller.ts
        project.service.ts
        project.repository.ts
        project.mapper.ts
        project.types.ts
      docs/
      users/
    core/
      config/
      db/
      errors/
      logger/
    workers/
      doc-generation.worker.ts
  tests/
```

- **File**:
  - `kebab-case` per file (`project-service.ts`, `user-controller.ts`)
- **Cartelle**:
  - `kebab-case` o `lowercase` (`modules`, `core`, `workers`)

#### 3.1.2. Classi, tipi, interfacce

```ts
// PascalCase
export class ProjectService {}

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
}

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export enum GenerationStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Failed = 'FAILED',
  Completed = 'COMPLETED',
}
```

#### 3.1.3. Funzioni e metodi

```ts
// camelCase - verbo o verbo + oggetto
async function createProject(input: CreateProjectInput): Promise<Project> {
  // ...
}

private validateGenerationParams(params: GenerateDocParams): void {
  // ...
}
```

#### 3.1.4. Variabili e parametri

```ts
// camelCase, descrittive
const projectName: string = 'Architecture Demo';
let maxRetryCount = 3;
const isActiveUser = true;
const generationJobId = '...';

function findByProjectId(projectId: string) {
  // ...
}
```

#### 3.1.5. Costanti

```ts
// UPPER_SNAKE_CASE per costanti globali
export const MAX_GENERATION_RETRY = 3;
export const DEFAULT_LOCALE = 'it-IT';

const JWT_ACCESS_TOKEN_TTL_SECONDS = 900;
const JWT_REFRESH_TOKEN_TTL_DAYS = 14;
```

#### 3.1.6. Namespace/logical modules

- Nomi modulo coerenti con il dominio:
  - `projects`, `documents`, `doc-generation`, `users`, `auth`.

### 3.2. Frontend (React / TypeScript)

#### 3.2.1. File e cartelle

Struttura suggerita:

```
frontend/
  src/
    app/
      routes/
      providers/
    modules/
      projects/
        components/
          ProjectList.tsx
          ProjectForm.tsx
        pages/
          ProjectListPage.tsx
          ProjectDetailPage.tsx
        hooks/
        api/
    shared/
      components/
      hooks/
      utils/
      types/
```

- **Componenti React**: `PascalCase` in file `.tsx` (uno per file)
- **Hook React custom**: `useXxx` in `camelCase`, file `useXxx.ts`

#### 3.2.2. Componenti

```tsx
// PascalCase per componenti
export function ProjectListPage() {
  return <ProjectList />;
}
```

#### 3.2.3. Props, state e variabili

```tsx
type ProjectListProps = {
  projects: ProjectSummary[];
  onProjectSelect: (id: string) => void;
};

function ProjectList({ projects, onProjectSelect }: ProjectListProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // ...
}
```

#### 3.2.4. CSS / Styling

- Preferito CSS-in-JS tramite libreria UI (Material UI / Chakra) **oppure** CSS Modules.
- Nomi classi CSS in `kebab-case`: `.project-list-container`.

---

## 4. Pattern Architetturali

### 4.1. Layer Backend

- **API / Controller Layer (`api/`):**
  - Definizione rotte (Express / Fastify)
  - Validazione input/parametri
  - Mapping tra HTTP e servizi
  - Nessuna logica di business complessa

- **Business / Service Layer (`modules/*/*.service.ts`):**
  - Logica di dominio e business
  - Orchestrazione delle chiamate ai repository e ad altri servizi
  - Gestione transazioni (via ORM/DB)

- **Data Access / Repository Layer (`modules/*/*.repository.ts`):**
  - Interazione col database tramite ORM (Prisma consigliato)
  - Nessuna logica di business, solo mapping dati

- **Workers (`workers/`):**
  - Job asincroni (es. generazione documentazione)

#### 4.1.1. Controller (Express esempio)

```ts
// src/api/projects.routes.ts
import { Router } from 'express';
import { ProjectService } from '../modules/projects/project.service';
import { validateRequest } from '../core/middleware/validate-request';
import { createProjectSchema } from '../modules/projects/project.schemas';

export function createProjectRouter(projectService: ProjectService): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projects = await projectService.listProjectsForUser(userId);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', validateRequest(createProjectSchema), async (req, res, next) => {
    try {
      const userId = req.user.id;
      const project = await projectService.createProject(userId, req.body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
```

Regole:

- Non esporre entità DB grezze, usare DTO/response models.
- Nessuna logica di autorizzazione complessa: demandare ad appositi middleware/servizi.

#### 4.1.2. Service

```ts
// src/modules/projects/project.service.ts
import { ProjectRepository } from './project.repository';
import { CreateProjectInput, ProjectDto } from './project.types';
import { mapProjectToDto } from './project.mapper';
import { NotFoundError, ForbiddenError } from '../../core/errors';

export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async listProjectsForUser(userId: string): Promise<ProjectDto[]> {
    const projects = await this.projectRepository.findByOwnerId(userId);
    return projects.map(mapProjectToDto);
  }

  async createProject(ownerId: string, input: CreateProjectInput): Promise<ProjectDto> {
    const project = await this.projectRepository.create({
      name: input.name,
      description: input.description,
      ownerId,
    });
    return mapProjectToDto(project);
  }

  async getProjectDetails(userId: string, projectId: string): Promise<ProjectDto> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError('You are not allowed to view this project');
    }
    return mapProjectToDto(project);
  }
}
```

Regole:

- Il service non conosce le API HTTP (niente `req`/`res`).
- Controlli di autorizzazione di business qui, non nel repository.
- Errori sempre con eccezioni tipizzate (vedi §6).

#### 4.1.3. Repository (Prisma esempio)

```ts
// src/modules/projects/project.repository.ts
import { PrismaClient, Project as ProjectEntity } from '@prisma/client';

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<ProjectEntity | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }

  findByOwnerId(ownerId: string): Promise<ProjectEntity[]> {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: { name: string; description?: string | null; ownerId: string }): Promise<ProjectEntity> {
    return this.prisma.project.create({ data });
  }
}
```

Regole:

- Nessuna gestione HTTP, nessuna logica di autorizzazione.
- Query con nomi descrittivi in base all’uso.

### 4.2. Frontend (React)

#### 4.2.1. Componenti Presentational vs Container

- **Presentational components** (in `components/`):
  - Ricevono dati via props
  - Non chiamano direttamente API
- **Container / Page components** (in `pages/`):
  - Gestiscono fetch dei dati (React Query / fetch)
  - Gestiscono routing e stato globale

```tsx
// src/modules/projects/pages/ProjectListPage.tsx
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../api/projects.api';
import { ProjectList } from '../components/ProjectList';

export function ProjectListPage() {
  const { data: projects = [], isLoading } = useQuery(['projects'], getProjects);

  if (isLoading) return <div>Caricamento...</div>;

  return <ProjectList projects={projects} />;
}
```

---

## 5. Tipizzazione e DTO

### 5.1. Backend

- Usare **tipi DTO espliciti** per input/output servizi e API.
- Non esporre direttamente i tipi generati dall’ORM.

```ts
// src/modules/projects/project.types.ts
export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type ProjectDto = {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string; // ISO string
};
```

### 5.2. Mapper

```ts
// src/modules/projects/project.mapper.ts
import { Project as ProjectEntity } from '@prisma/client';
import { ProjectDto } from './project.types';

export function mapProjectToDto(entity: ProjectEntity): ProjectDto {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    ownerId: entity.ownerId,
    createdAt: entity.createdAt.toISOString(),
  };
}
```

---

## 6. Gestione degli Errori

### 6.1. Classi di errore

```ts
// src/core/errors/base-error.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// src/core/errors/domain-errors.ts
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}
```

### 6.2. Middleware di errore (Express)

```ts
// src/core/middleware/error-handler.ts
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/base-error';
import logger from '../logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn({ err, path: req.path }, 'Handled application error');
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: process.env.NODE_ENV === 'production' ? undefined : err.details,
      },
    });
    return;
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Si è verificato un errore imprevisto',
    },
  });
}
```

Regole:

- Non restituire stacktrace o dettagli sensibili in produzione.
- Le funzioni async nei controller devono sempre gestire errori con `try/catch` + `next(error)`.

---

## 7. Logging

### 7.1. Backend

- Utilizzare un logger strutturato (es. Pino) in `core/logger`.

```ts
// src/core/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export default logger;
```

### 7.2. Convenzioni di logging

- **Livello `debug`**: dettagli tecnici, parametri, flusso di esecuzione.
- **Livello `info`**: eventi business importanti (login, creazione progetto, avvio job).
- **Livello `warn`**: situazioni inattese ma non bloccanti.
- **Livello `error`**: eccezioni ed errori che impediscono l’operazione.

Esempi:

```ts
logger.info({ userId, projectId }, 'Project created successfully');

logger.debug({ jobId, params }, 'Starting doc generation job');

logger.warn({ userId }, 'Unauthorized access attempt to project');

logger.error({ err, jobId }, 'Doc generation job failed');
```

Regole:

- Non loggare dati sensibili (password, token, dati personali non necessari).
- Includere sempre contesto (id utente, id progetto, id job).

---

## 8. Sicurezza

- Validare sempre input sia lato backend sia lato frontend.
- Per SQL:
  - Usare **ORM** o query parametrizzate → mai concatenare stringhe SQL.
- Autenticazione:
  - JWT con scadenza breve per access token, più lunga per refresh token.
  - I segreti JWT devono sempre stare in variabili d’ambiente sicure.
- Autorizzazione:
  - Verifiche di ruolo/permessi nel service layer (user.role, ownership).
- Upload file:
  - Validare dimensione massima.
  - Validare MIME type.
  - Sanitizzare nome file.
- CORS:
  - Configurare origin ammessi in base all’ambiente.

---

## 9. Testing

### 9.1. Backend

- Framework: Jest (o Vitest) + Supertest per test API.
- Struttura:

```
backend/
  tests/
    unit/
      modules/
    integration/
      api/
```

#### 9.1.1. Test di unità (service/repository)

```ts
// tests/unit/modules/projects/project.service.spec.ts
import { ProjectService } from '../../../src/modules/projects/project.service';
import { ProjectRepository } from '../../../src/modules/projects/project.repository';

describe('ProjectService', () => {
  it('dovrebbe restituire i progetti dell’utente', async () => {
    const mockRepo = {
      findByOwnerId: jest.fn().mockResolvedValue([{ id: '1', name: 'Demo', ownerId: 'u1' }]),
    } as unknown as ProjectRepository;

    const service = new ProjectService(mockRepo);

    const result = await service.listProjectsForUser('u1');

    expect(mockRepo.findByOwnerId).toHaveBeenCalledWith('u1');
    expect(result).toHaveLength(1);
  });
});
```

#### 9.1.2. Test di integrazione API

```ts
// tests/integration/api/projects.api.spec.ts
import request from 'supertest';
import { createApp } from '../../../src/app';

describe('GET /api/projects', () => {
  it('dovrebbe restituire 401 se non autenticato', async () => {
    const app = await createApp();
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});
```

### 9.2. Frontend

- Framework: Jest + React Testing Library.
- Regole:
  - Testare la logica UI (render, interazioni, stati).
  - Evitare di testare dettagli di implementazione (class name, strutture interne).

```tsx
// src/modules/projects/components/ProjectList.test.tsx
import { render, screen } from '@testing-library/react';
import { ProjectList } from './ProjectList';

test('mostra i nomi dei progetti', () => {
  const projects = [
    { id: '1', name: 'Proj1' },
    { id: '2', name: 'Proj2' },
  ] as any;

  render(<ProjectList projects={projects} />);

  expect(screen.getByText('Proj1')).toBeInTheDocument();
  expect(screen.getByText('Proj2')).toBeInTheDocument();
});
```

---

## 10. Migrazioni Database

- Usare strumento dell’ORM (es. Prisma Migrate) o `knex migrate`.
- Naming migrazioni: `YYYYMMDDHHMM__descrizione.sql/ts`
- Ogni modifica schema deve avere:
  - Migrazione applicabile
  - Script di rollback ove possibile

---

## 11. Code Review Checklist

Prima di approvare una PR, verificare:

- [ ] Convenzioni di naming rispettate (file, classi, funzioni, variabili).
- [ ] Nessuna logica di business nei controller; tutto nel service layer.
- [ ] Repository senza logica di autorizzazione/business.
- [ ] Errori gestiti tramite classi AppError e middleware di errore.
- [ ] Logging presente in punti chiave, senza dati sensibili.
- [ ] Tipi/DTO definiti chiaramente per input e output.
- [ ] Validazione input (schema validator es. Zod/Joi) per tutte le API pubbliche.
- [ ] Test unitari per nuova logica business e test integrazione per nuove API.
- [ ] Nessun valore “magico”: usare costanti nominate.
- [ ] Nessun `any` in TypeScript se non motivato e documentato.
- [ ] Nessuna credenziale o segreto nel codice (solo env vars).

---

Questi standard vanno versionati nella cartella `docs_re/` o equivalente e aggiornati man mano che l’architettura del progetto **demo** evolve (es. introduzione di nuovi moduli, cambi di stack o tool).