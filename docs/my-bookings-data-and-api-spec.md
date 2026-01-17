# Spec Tecnica (Draft) — Pagina "Le Mie Prenotazioni"

Versione: 0.1
Data: 17/01/2026
Autore: Team Backend/Frontend
Stato: Proposta per validazione PO/Team

1) Stato attuale (repo)
- Backend: non esistono endpoints per elenco prenotazioni utente. Presenti solo:
  - /api/postazioni/status (stato 12 postazioni)
  - /api/calendar/disabled-dates (domeniche/festività)
- Frontend:
  - Pagina MyBookingsPage è placeholder (nessuna chiamata API)
  - bookingService.ts implementa solo createDeskBooking (stub), nessuna API di lettura
- Modello dati DB: non esiste ancora una tabella Booking. Esiste solo User (+ refresh_tokens)

2) Modello Dati proposto (Booking)
- Scopo: prenotazione giornaliera di una postazione (date-only). Estendibile in futuro a fasce orarie.
- Campi principali:
  - id: uuid (PK)
  - userId: uuid (FK -> users.id)
  - deskId: string (id postazione, es. "1".."12"); futuro: FK -> desks
  - date: DATE (data prenotazione, semantica Europe/Rome, senza orario)
  - status: enum { PENDING, CONFIRMED, CANCELLED }
  - createdAt: timestamptz UTC (default now())
  - updatedAt: timestamptz UTC (@updatedAt)
  - opzionali futuri: buildingId/floorId, note, source, startAt/endAt (se si introducono slot)
- Vincoli/indici:
  - UNIQUE(deskId, date) — prevenzione doppie prenotazioni sulla stessa postazione e giorno
  - INDEX(userId, date) — ottimizza elenco per utente ordinato per data
  - INDEX(userId, status, date) — utile per filtri per stato

3) API di lettura (da creare)
- GET /api/bookings/me
  - Descrizione: restituisce le prenotazioni dell’utente autenticato
  - Sicurezza: Authorization: Bearer; restituisce SOLO le prenotazioni dell’utente corrente
  - Query params:
    - from: YYYY-MM-DD (opzionale; default=today)
    - to: YYYY-MM-DD (opzionale; default=null → nessun limite superiore)
    - status: lista CSV (es. CONFIRMED,PENDING). Default: tutte tranne CANCELLED, oppure confermare con PO
    - limit: int (1..100, default=20)
    - cursor: string opaco per pagination forward, basato su (date,id) → es. "2026-01-17:uuid"
    - order: asc|desc (default=asc su campo date, tie-break su id)
  - Response 200: {
      items: Array<{ id, deskId, deskName?, date, status, createdAt, updatedAt }>,
      nextCursor?: string
    }
  - Note implementative:
    - Ordinamento stabile per (date asc, id asc)
    - Filtri con where: { userId, date >= from, date <= to?, status in? }
    - Paginazione keyset con (date,id) per prestazioni

- Opzionale (amministrazione): GET /api/bookings?userId=&from=&to=&status=&limit=&cursor=&order=

4) Regole di ordinamento e UX attesa
- Requisito business: "più prossime in alto". Proposta:
  - Default elenco mostra SOLO prossime (from=today, order=asc). Le passate si vedono impostando to=today-1 o attivando un toggle "Includi passate" (UI)
  - Alternativa se richiesto: API restituisce tutte e il frontend le raggruppa in 2 sezioni:
    - Prossime: date >= today (ordinamento asc)
    - Passate: date < today (ordinamento desc)
- Conferma richiesta al PO su quale delle due sia preferita; default implementativo: solo future per semplicità e chiarezza.

5) Fusi orari e formato date
- Campo Booking.date: DATE (senza orario) — evita ambiguità DST per prenotazioni giornaliere
- createdAt/updatedAt: UTC, serializzazione ISO 8601 in risposta
- Interfaccia: UI mostra date in locale utente (it-IT) e assume timezone Europe/Rome
- Parametri from/to: stringhe YYYY-MM-DD (date-only). Validazione come in /api/calendar/disabled-dates

6) Errori previsti
- 401/403: non autenticato/non autorizzato
- 400: parametri invalidi (formato data, range eccessivo, limit)
- 500: errori interni

7) Impatti su DB/Prisma (proposta)
- Nuovo modello Prisma Booking:
  model Booking {
    id         String   @id @default(uuid()) @db.Uuid
    userId     String   @map("user_id") @db.Uuid
    deskId     String   @map("desk_id") @db.VarChar(64)
    date       DateTime @db.Date
    status     String   @db.VarChar(16) // oppure enum Prisma
    createdAt  DateTime @map("created_at") @default(now()) @db.Timestamptz(6)
    updatedAt  DateTime @map("updated_at") @updatedAt @db.Timestamptz(6)
    user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@map("bookings")
    @@unique([deskId, date])
    @@index([userId, date])
    @@index([userId, status, date])
  }
- Migrazione: creazione tabella bookings con vincoli/indici come sopra

8) Pianificazione e step successivi
- Validazione PO su:
  - Default elenco (solo future vs. grouping future/past in una sola risposta)
  - Stati di prenotazione rilevanti in elenco (includere/celare CANCELLED)
- Implementazione Backend:
  - Prisma model + migrazione
  - Repository/Service + endpoint GET /api/bookings/me (keyset pagination)
- Implementazione Frontend:
  - Service client fetchMyBookings() con token
  - MyBookingsPage: chiamata API + rendering ordinato/paginato
  - Gestione stato data (SelectedDateContext) solo per filtri iniziali se richiesto

Note: compatibilità con bookingService (create) già presente; validazioni su domeniche/festività lato server riuso HolidayService.
