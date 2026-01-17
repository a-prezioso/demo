# Routing Frontend, Bottom Navigation e Stato Data

Versione: 1.0  
Data: 17/01/2026  
Autore: Frontend Team  
Stato: Draft

---

Obiettivo
- Documentare architettura e integrazione della bottom navigation
- Descrivere lo schema di routing tra mappa e sezione "Le mie prenotazioni"
- Definire il meccanismo di gestione del contesto della data selezionata
- Fornire linee guida per estendere la bottom navigation mantenendo il contesto
- Collegare i test principali utili a future modifiche

Riferimenti codice sorgente (principali)
- Component BottomNavigation: frontend/src/components/BottomNavigation.tsx
- Layout protetto: frontend/src/router/ProtectedLayout.tsx
- Router app: frontend/src/router/AppRouter.tsx
- Guard autenticazione: frontend/src/router/ProtectedRoute.tsx
- Context data selezionata: frontend/src/context/SelectedDateContext.tsx
- Pagina mappa: frontend/src/pages/DashboardPostazioni.tsx
- Pagina Le mie prenotazioni: frontend/src/pages/MyBookingsPage.tsx

---

1) Architettura Bottom Navigation

Struttura del componente
- File: frontend/src/components/BottomNavigation.tsx
- Esporta <BottomNavigation/> con props opzionali { style?, className? }
- Struttura:
  - <nav role="navigation" aria-label="Navigazione principale"> contenente una <ul>
  - Ogni elemento è un <NavLink> verso una destinazione primaria
  - Gli item correnti applicano uno stile "active" (background blue-600) e non correnti "inactive" (gray-800)
  - Icone testuali semplici (emoji) con aria-hidden; label testuale sempre visibile
  - Accessibilità: aria-current gestito da NavLink; sr-only per stato selezionato

Punti di integrazione
- Il componente è montato all’interno del layout protetto: frontend/src/router/ProtectedLayout.tsx
  - <SelectedDateProvider> avvolge <Outlet/> e <BottomNavigation/>
  - La bottom bar è fissa (position: fixed, bottom: 0); il layout aggiunge paddingBottom per evitare sovrapposizioni

Convenzioni di naming
- Rotte principali in italiano, sotto prefisso /dashboard
  - "/dashboard/mappa" → mappa postazioni
  - "/dashboard/prenotazioni" → sezione Le mie prenotazioni
- Query string per contesto data: chiave fissa "date" con formato YYYY-MM-DD
- Nomi componenti in PascalCase (BottomNavigation, ProtectedLayout, SelectedDateProvider)
- Variabili e funzioni helper coerenti: toDateKey, fromDateKey, useSelectedDate

Preservazione del contesto via URL
- La bottom navigation usa NavLink con to={ pathname, search } per preservare la query string corrente (incluso date=)
- Questo garantisce consistenza del contesto data tra le sezioni

---

2) Schema di Routing e Guard

Implementazione: frontend/src/router/AppRouter.tsx

Rotte pubbliche
- /login  → pagina login mock (dimostrativa); se già autenticati, redirect a /dashboard/mappa
- /signup → pagina signup mock; se già autenticati, redirect a /dashboard/mappa

Rotte protette (wrappate da <ProtectedRoute/>)
- Layout persistente (<ProtectedLayout/>): include <SelectedDateProvider/> e <BottomNavigation/>
- /dashboard/mappa          → <DashboardPostazioni/>
- /dashboard/prenotazioni   → <MyBookingsPage/>
- Compat: /dashboard        → redirect 302 client a /dashboard/mappa
- Compat: /my-bookings      → redirect 302 client a /dashboard/prenotazioni
- Altre sezioni demo: /booking, /timesheet, /projects, /profile
- 404 in-app: path="*" gestito da NotFoundInApp con link rapidi che preservano la query string

Guard di autenticazione
- File: frontend/src/router/ProtectedRoute.tsx
- Usa useAuth() per verificare isAuthenticated
- Se non autenticato: <Navigate to="/login" replace state={{ from: location }} />
  - La pagina di login utilizza state.from per tornare alla destinazione post-login
  - Preserva window.location.search nella navigazione post-login/signup per mantenere il contesto (es. ?date=)

Comportamento dello stack di navigazione
- SPA con BrowserRouter: la navigazione è client-side
- Lo stato della data è sincronizzato con la URL query (?date=)
- Cambiando sezione tramite bottom nav, la query è mantenuta; il contesto rimane coerente
- Navigazione indietro/avanti del browser aggiorna correttamente il contesto data grazie agli effect del provider

---

3) Gestione Stato della Data Selezionata

Definizione e responsabilità
- File: frontend/src/context/SelectedDateContext.tsx
- Espone un provider e un hook:
  - <SelectedDateProvider>{children}</SelectedDateProvider>
  - useSelectedDate() → { date: Date, setDate(d: Date), dateKey: string }
- Single source of truth per la data corrente a livello app (nelle pagine protette)

Sincronizzazione con URL
- Parametro standard: date=YYYY-MM-DD (timezone locale; semantica date-only)
- Inizializzazione:
  - Se presente e valido → parse con fromDateKey()
  - Altrimenti default → oggi (startOfDay locale)
- Effetti di sincronizzazione:
  - Se cambia la query esternamente (es. back/forward) il provider aggiorna lo stato interno
  - Se cambia lo stato interno, il provider imposta/aggiorna la query param (?date=) con navigate(..., { replace: true }) per evitare gonfiare lo storico

Update e consumo
- Update dalla Mappa: DashboardPostazioni include un semplice controllo <input type="date"> collegato a setDate; aggiorna il provider → aggiorna URL
- Consumo in "Le mie prenotazioni": MyBookingsPage legge date, dateKey e consente il cambio con un control analogo
- La bottom navigation preserva il parametro, per cui il contesto è condiviso tra le sezioni senza ulteriore codice

Regole di default e edge case
- Default: oggi se date mancante o non valida
- Validazione round-trip: fromDateKey controlla che l’oggetto Date corrisponda al valore testuale (evita input come 2026-02-31)
- Normalizzazione: setDate tronca a inizio giornata locale (startOfDay) per coerenza di confronto/serializzazione
- Timezone: la semantica è locale all’utente; il valore in URL è privo di fuso (date-only)
- Back/forward: gli effect reagiscono al cambiamento della URL mantenendo lo stato allineato

---

4) Linee Guida per Estendere la Bottom Navigation

Obiettivo: aggiungere nuove sezioni mantenendo il contesto (es. data)

Passi consigliati
- Routing
  - Aggiungi la route in AppRouter sotto il blocco protetto (<ProtectedLayout/>)
  - Preferisci lazy loading (React.lazy(() => import('...')))
- UI Bottom Nav
  - Aggiungi l’item nel vettore items in BottomNavigation.tsx: { to, label, icon }
  - Usa to={{ pathname: newPath, search }} per preservare la query (incluso ?date=)
  - Mantieni le convenzioni di stile (active/inactive) e accessibilità (aria-label, aria-hidden per icone, touch target >= 44px)
- Stato data
  - Se la nuova pagina dipende dalla data, usa useSelectedDate() e NON creare uno stato data duplicato locale
  - Usa dateKey per binding con <input type="date">
- Layout / UX
  - Assicurati che i contenuti non siano coperti dalla bottom bar: rispettare il paddingBottom in ProtectedLayout
  - Mantieni label brevi e in italiano; icone semplici e consistenti
- Naming & URL
  - Segmenti in minuscolo, descrittivi e stabili (es. /dashboard/report)
  - Riutilizza la chiave di query "date" se la sezione ha semantica calendar/date-based

Errori comuni da evitare
- Navigazioni che perdono la query string (usare sempre to={{ pathname, search }})
- Gestione data locale al componente che diverge dal provider
- Modifica non coordinata del nome chiave query (deve rimanere "date")

---

5) Link a Test Principali e Coverage Correlata

Al momento non sono presenti test frontend specifici per bottom navigation e SelectedDateContext. Esistono però test backend che coprono parti funzionali correlate al flusso (stato postazioni e calendario di chiusura):
- Stato postazioni (dashboard): backend/test/station/StationService.test.ts
- Festività/domeniche (blocco date lato backend): backend/test/calendar/HolidayService.test.ts

Suggerimenti per futuri test frontend (da pianificare)
- Unit: SelectedDateContext — sincronizzazione con URL, default e edge case
- Unit: BottomNavigation — preservazione search, stato attivo, accessibilità base
- Integration: AppRouter + ProtectedLayout — guard di autenticazione, redirect post-login con query, persistenza contesto
- Integration: DashboardPostazioni ↔ MyBookingsPage — cambio data nella mappa che si riflette nelle prenotazioni e viceversa

---

6) Appendix: Comportamenti chiave in codice

Estratti sintetici (vedi file sorgenti per i dettagli):
- Preservazione query nella bottom nav: <NavLink to={{ pathname: item.to, search }} ... />
- Provider data sincronizzato con URL:
  - parse iniziale da URL (fromDateKey)
  - effect → aggiorna URL se cambia lo stato interno
  - effect → ascolta cambi URL e riallinea lo stato
- Guard auth con ritorno post-login: <Navigate to="/login" replace state={{ from: location }} /> + redirect con window.location.search

Questa documentazione definisce lo standard per routing, bottom navigation e gestione del contesto data nella PWA, abilitando estensioni coerenti e sicure nel tempo.