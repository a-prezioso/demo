# Tech Stack - SmartDesk Coworking MVP

**Versione:** 2.0  
**Data:** 19/01/2026  
**Autore:** Architect Agent  

---

## 1. Panoramica

Stack **minimalista** per PWA di prenotazione postazioni coworking:

| Layer | Tecnologia |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |

---

## 2. Frontend

| Tecnologia | Versione | Ruolo |
|------------|----------|-------|
| React | 18.x | UI Library |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| React Router | 6.x | Routing |
| TailwindCSS | 3.x | Styling |

### PWA Features
- Service Worker per offline
- Manifest per installazione
- Mobile-first responsive

---

## 3. Backend

| Tecnologia | Versione | Ruolo |
|------------|----------|-------|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | HTTP Framework |
| TypeScript | 5.x | Type safety |
| jsonwebtoken | 9.x | JWT auth |
| bcrypt | 5.x | Password hashing |
| zod | 3.x | Validation |

---

## 4. Database

| Tecnologia | Versione | Ruolo |
|------------|----------|-------|
| PostgreSQL | 15+ | Database |
| Prisma | 5.x | ORM |

### Schema
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  name         String
  bookings     Booking[]
  createdAt    DateTime  @default(now())
}

model Desk {
  id       Int       @id @default(autoincrement())
  number   Int       @unique
  bookings Booking[]
}

model Booking {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  desk      Desk     @relation(fields: [deskId], references: [id])
  deskId    Int
  date      DateTime @db.Date
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())

  @@unique([userId, date])
  @@unique([deskId, date])
}
```

---

## 5. Dev Tools

| Tool | Ruolo |
|------|-------|
| ESLint | Linting |
| Prettier | Formatting |
| Jest | Testing |
| GitHub Actions | CI/CD |

---

## 6. Hosting (Raccomandato)

| Servizio | Uso |
|----------|-----|
| Vercel / Netlify | Frontend PWA |
| Railway / Render | Backend API |
| Supabase / Neon | PostgreSQL managed |

---

## 7. Dipendenze Minime

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "@prisma/client": "^5.7.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "zod": "^3.22.0",
    "cors": "^2.8.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/bcrypt": "^5.0.0",
    "typescript": "^5.3.0",
    "prisma": "^5.7.0"
  }
}
```
