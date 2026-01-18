# Flusso UI – Selezione Postazione e Popup di Conferma Prenotazione

Versione: 1.0
Data: 18/01/2026
Autore: UX/Frontend Team
Stato: Draft

---

1) Contesto e Stato Attuale
- La dashboard mostra 12 postazioni in una mappa/grid (SeatMap + SeatMarker).
- InfoBottomSheet si apre al tap su una postazione e mostra: nome, stato, info e CTA "Prenota" se Libera.
- Polling ogni 30s aggiorna gli stati, pulsante Refresh manuale.

2) Evento di Selezione
- Interazione primaria: single tap/click su marker di una postazione.
- Regole:
  - Se stato = LIBERO → apre bottom sheet con dettagli e CTA "Prenota".
  - Se stato = OCCUPATO o NON DISPONIBILE → nessun popup; il marker è disabilitato (aria-disabled implicito: button disabled) e non genera azione.
- Accessibilità: marker è un button con aria-label "<Nome>: <Stato>" e focus stile visibile.

3) Popup/Bottom Sheet Informativo
- Titolo: <Nome Postazione> (es. "A1").
- Campi: Stato (Libero/Occupato/N.D.), Info opzionali.
- Azioni: [Prenota] (solo se Libero), [Chiudi].

4) Popup di Conferma Prenotazione (Modal)
- Attivazione: tap su [Prenota] nel bottom sheet.
- Dati minimi mostrati:
  - Data di prenotazione: data corrente (YYYY-MM-DD) o data selezionata dal contesto (quando disponibile). Formattata in it-IT.
  - Postazione: nome/numero (es. A1). Opzionale: edificio/piano se già disponibili nel contesto.
- Testi suggeriti:
  - Titolo: "Conferma prenotazione"
  - Messaggio: "Confermi la prenotazione della postazione <A1> per la data <18/01/2026>?"
  - Pulsanti: "Annulla" (secondary), "Conferma" (primary)
- Comportamento pulsanti:
  - Annulla → chiude la modale e torna alla mappa (bottom sheet resta chiuso).
  - Conferma → invia la richiesta di prenotazione; fino all'integrazione API, redirect a pagina /prenotazioni/nuova?seatId=<id>&date=<YYYY-MM-DD>.
- Stati di caricamento/errore: il pulsante Conferma mostra "Conferma…" e si disabilita durante la richiesta; eventuale errore viene mostrato all'interno della modale.
- Accessibilità: role="dialog", aria-modal="true", aria-labelledby al titolo; backdrop cliccabile per chiudere.

5) Postazioni non libere
- Nessun popup; i marker sono disabilitati (attributo disabled) e stilati con colore di stato grigio/rosso. Cursor default; niente hover di attivazione.
- Rationale: ridurre frustrazione/rumore UX. Stato già leggibile da colore/icone.

6) Allineamento UI/UX
- Coerenza con docs/dashboard-mobile-first.md e docs/ui-ux/dashboard-ui-spec.md (colori, bottom sheet, accessibilità).
- La modale riusa il tema dei pulsanti (primary/secondary) e spaziature.

7) Wireframe (ASCII)

Stato: Tap su A1 (Libero) → Bottom Sheet
+------------------------------------------------------+
|  ⓧ  Postazione A1                                    |
|------------------------------------------------------|
|  Stato:  Libero                                      |
|  Info:   Vicino finestra                             |
|                                                      |
|  [Prenota]                           [Chiudi]        |
+------------------------------------------------------+

Tap su [Prenota] → Modale Conferma
+-------------------------+
| Conferma prenotazione   |
|-------------------------|
| Confermi la prenotazione|
| della postazione A1 per |
| la data 18/01/2026?     |
|                         |
| [Annulla]  [Conferma]   |
+-------------------------+

8) Note Tecniche
- Componenti:
  - InfoBottomSheet: esistente, espone onBook(seat) → apre modale
  - ConfirmBookingModal: nuova modale con props { seat, dateLabel, onConfirm, onCancel }
- Gestione stato:
  - DashboardPostazioni mantiene selected (per bottom sheet) e confirmSeat (per modale).
  - Data di riferimento: oggi (todayIso) finché non si integra il DatePicker/contesto.
- Futuro:
  - Integrare chiamata API POST /api/bookings con body { seatId, date } e gestire esito.
  - Se disponibile, mostrare edificio/piano nel messaggio.
