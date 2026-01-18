MyBookings - Cancellation UX

Scope
- Provide a cancellazione azione nella pagina "Le Mie Prenotazioni" con rispetto vincolo 24h.

Key points
- Usa isBookingCancellable per pre-check client (non autoritativo).
- Conferma tramite window.confirm (può essere sostituito con modal UI lib).
- Chiamata POST /api/bookings/:id/cancel via cancelBooking helper.
- Gestione errori: se backend risponde con code BOOKING_CANCELLATION_WINDOW, mostra messaggio localizzato che ricorda le 24 ore.
- Aggiorna la lista in memoria senza ricaricare la pagina. onRefresh callback opzionale per refetch esterno.

Accessibility
- Button con aria-label specifico per ogni prenotazione.

Mobile/Desktop
- Stili inline minimi responsivi. Integrare con design system del portale se disponibile.
