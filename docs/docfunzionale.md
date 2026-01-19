Documento Funzionale: SmartDesk Coworking (MVP)
1. Obiettivo
PWA mobile-first per prenotare postazioni in un coworking con 6 posti.
2. Funzionalità Core
A. Autenticazione Base
Login con email/password (no signup, utenti pre-registrati)
Sessione JWT persistente
B. Mappa Postazioni
Visualizzazione di 6 postazioni in griglia 2x3
Colori: Verde (libero), Rosso (occupato)
Click su postazione libera → conferma prenotazione
Selettore data (solo giorni feriali, weekend bloccato)
C. Le Mie Prenotazioni
Lista prenotazioni dell'utente
Possibilità di cancellare (se > 24h prima)
3. Schema Dati
Tabella	Campi
Users	id, email, password_hash, name
Desks	id, number (1-6)
Bookings	id, user_id, desk_id, date, status
4. Vincoli
Weekend automaticamente bloccato (no festività complesse)
Massimo 1 prenotazione per utente per giorno
