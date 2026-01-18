# Dashboard con Mappa delle 12 Postazioni – Specifica Mobile‑First (Wireframe + UI/UX)

Versione: 1.0
Data: 18/01/2026
Autore: UX/Frontend Team
Stato: Draft

---

1. Obiettivo

Definire layout e interazioni base della dashboard che mostra una mappa interattiva con 12 postazioni (desk). Target primario mobile (portrait), con adattamento per tablet/desktop. La soluzione deve essere leggera (SVG/DOM), accessibile e facilmente integrabile nel frontend React (vedi docs/source-tree.md, sezione frontend).

---

2. Struttura Layout (mobile‑first)

2.1. Blocchi principali
- Header (sticky): titolo, azioni contestuali
- Area Mappa (scroll/zoom dentro il canvas, non l’intera pagina)
- Legenda/Status Bar (collassabile)
- FAB Refresh (azione rapida)
- Bottom Sheet Info (on tap di una postazione)

2.2. Wireframe – Mobile (portrait)

+------------------------------------------------+
| [≡] Dashboard                         ⟳ Refresh |
|-----------------------------------------------|
|                                               |
|             [   Mappa (SVG)   ]               |
|  • 12 marker cliccabili (tap area ≥44x44px)   |
|  • Pinch/zoom opzionale + pulsanti (+)(−)     |
|                                               |
|                        (+)  (−)               |
|-----------------------------------------------|
|  ◻︎ Legenda:  ● Libero   ■ Occupato   ▲ N/D   |
|  (tappable → espande/chiude dettagli)         |
+------------------------------------------------+
| ⌄ Postazione A1                               |
|  Stato: Libero                                |
|  Info: Vicino finestra                        |
|  Azioni: [Prenota]  [Dettagli →]              |
+------------------------------------------------+

Note:
- FAB Refresh opzionale se non presente nel header: cerchio flottante in basso a destra (evitare sovrapposizione ai controlli zoom).
- Bottom sheet appare dopo tap su una postazione; swipe down o “X” per chiudere.

2.3. Wireframe – Tablet (landscape) / Desktop

+---------------------------------------------------------------------------------+
| [≡] Dashboard                                  | Ricerca [🔎] | ⟳ Refresh | 👤 |  |
|---------------------------------------------------------------------------------|
|                 |                                                                  |
|  Legenda        |                         Mappa (SVG)                             |
|  ● Libero       |                   [12 marker cliccabili]                         |
|  ■ Occupato     |                                                                  |
|  ▲ N/D          |                                                                  |
|                 |                                                                  |
|-----------------|------------------------------------------------------------------|
|     Pannello laterale info (dockable) / Bottom sheet su schermi medi              |
+---------------------------------------------------------------------------------+

Comportamento:
- Su viewport ≥ 1024px, la legenda può diventare un pannello laterale sinistro fisso.
- Il pannello info può “fissarsi” a destra; su tablet medi resta bottom sheet.

---

3. Comportamento Responsive

Breakpoints consigliati (customizzabili):
- XS: < 360px → attiva fallback “Lista” (vedi §7) e riduce padding; mappa zoomata di default.
- SM: 360–480px (mobile piccolo): layout mobile‑first standard.
- MD: 481–768px (mobile grande/phablet): mappa più ampia, legenda espansa di default.
- LG: 769–1024px (tablet): legenda a lato opzionale, pannello info bottom/dock.
- XL: ≥ 1024px (desktop): legenda/pannello laterali fissi, mappa centrata, più spazio negativo.

Regole:
- Header sticky con azioni sempre accessibili.
- Area mappa flessibile: altezza = viewportHeight − header − legenda (se visibile).
- Controlli zoom visibili su mobile; su desktop anche wheel+ctrl.
- Usare CSS clamp() per font-size dei marker label: clamp(10px, 1.6vw, 14px).

---

4. Interazioni Utente Minime

- Tap su postazione (marker): apre bottom sheet/pannello info con:
  - Nome postazione (es. "A1")
  - Stato (Libero/Occupato/Non disponibile)
  - Info base: posizione (finestra, presa, silenzio), eventuale orario di rilascio
  - CTA: “Prenota” (link alla pagina di prenotazione esistente) e “Dettagli”
- Refresh stato:
  - Pulsante nel header (sempre visibile). Alternativa: FAB.
  - Eventuale auto-refresh ogni 30s (configurabile), con spinner discreto in header.
- Zoom/Pan:
  - Mobile: pinch‑to‑zoom e pan sul canvas; controlli (+)/(−) come fallback.
  - Desktop: wheel con ctrl/cmd + drag pan.
- Accessibilità:
  - Tap target ≥ 44x44px; focus outline evidente; attivabili via tastiera (Enter/Space).
  - Annunci ARIA per cambio di stato e apertura foglio informativo.

---

5. Palette Colori e Codifica Visiva Stati

Obiettivo: distinguibilità cromatica + ridondanza percettiva per daltonismi.

Stati (colore principale + pattern/icona):
- Libero
  - Colore: Verde accessibile – #1F8A3A (AA su bianco con testo #0B3D1E)
  - Icona: ✓ check
  - Pattern: puntinato leggero all’interno del marker
- Occupato
  - Colore: Rosso acceso – #C53D3D (AA su bianco con testo #5A1010)
  - Icona: 👤 o ● pieno
  - Pattern: tratteggio diagonale (45°)
- Non disponibile
  - Colore: Grigio neutro – #6B7280 (AA su bianco con testo #111827)
  - Icona: 🔒 lucchetto o ⊘
  - Pattern: griglia a crocette

Colori di supporto:
- Sfondo mappa: #F9FAFB
- Contorno marker (alto contrasto): #111827 con spessore 2px
- Hover/Focus outline: #2563EB

Ridondanza percettiva:
- Oltre al colore, usare icone diverse e pattern/texture nel marker.
- Forma del marker differenziata opzionale: 
  - Libero = cerchio; Occupato = quadrato; N/D = triangolo.

Dark mode (facoltativa): sostituire sfondo mappa con #0B1220 e alzare luminanza dei colori primari del 20%.

---

6. Accessibilità (base)

- Contrasto testo/icone su marker ≥ 4.5:1 (WCAG AA)
- ARIA:
  - Ogni marker: role="button", aria-label="Postazione A1, Libero"
  - Aggiornamento stato: aria-live="polite" in un region associato alla mappa
  - Bottom sheet: dialog con focus trap, aria-labelledby/aria-describedby
- Tastiera:
  - Navigazione marker con Tab/Shift+Tab, attivazione con Enter/Space
  - Pulsanti (+)/(−) raggiungibili e con tooltip
- Animazioni/trasformazioni: rispettare prefers-reduced-motion

---

7. Fallback per Schermi Molto Piccoli (XS < 360px)

- Toggle Mappa/Lista: switch sopra la mappa → default “Lista”
- Lista compatta delle 12 postazioni:
  [●] A1  Libero     [Prenota]
  [■] A2  Occupato   [Dettagli]
  [▲] A3  N/D        [Dettagli]
  ...
- La mappa resta disponibile ma con zoom iniziale elevato; controlli (+)/(−) sempre visibili.

---

8. Componenti Frontend proposti (React)

Struttura (allineata a docs/source-tree.md):
- frontend/src/features/dashboard/
  - pages/DashboardPage.tsx
  - components/SeatMap.tsx        (render mappa SVG + pan/zoom)
  - components/SeatMarker.tsx     (marker interattivo con stato)
  - components/Legend.tsx         (legenda collassabile / laterale)
  - components/InfoBottomSheet.tsx
  - components/ZoomControls.tsx   (+)/(−)
  - components/RefreshButton.tsx  (header o FAB)
  - api/dashboardApi.ts           (GET /api/desks | /api/seats)
  - state/dashboardSlice.ts       (o React Query hooks)

Note implementative:
- Mappa come SVG statico (floor plan semplificato) con 12 anchor points.
- Marker come <g> SVG o overlay assoluti; hit area ampliata per tap.
- Gestione zoom con transform: scale + translate; evitare reflow pesanti.

---

9. Flussi/States

- Loading iniziale: skeleton su mappa + badge “Caricamento…”.
- Success: render marker con animazione fade‑in (200ms, respect reduced motion).
- Error: toast non invasivo in fondo (“Impossibile aggiornare. Riprova”).
- Empty (raro): messaggio guida “Nessuna postazione configurata”.

Auto-refresh (opzionale): polling 30s con indicatore lieve nel pulsante Refresh.

---

10. Navigazione e Link Prenotazione

- CTA “Prenota” apre la pagina esistente di prenotazione (route es. /booking/:deskId)
- Se l’utente non è autenticato → redirect al login, poi ritorno alla prenotazione.

---

11. Specifiche tecniche sintetiche

- CSS variables (tema):
  :root {
    --seat-free: #1F8A3A;
    --seat-occupied: #C53D3D;
    --seat-unavailable: #6B7280;
    --seat-outline: #111827;
    --focus: #2563EB;
    --map-bg: #F9FAFB;
  }
- Dimensioni minime:
  - Hit area marker: 44x44px
  - Spazio tra marker vicini: ≥ 8px
- Performance:
  - Niente mappe tile; usare SVG/DOM; evitare ombre pesanti su mobile
  - Event throttling per pan/zoom

---

12. Checklist di Accettazione

- [ ] Mobile portrait: mappa navigabile, tap marker → bottom sheet con CTA
- [ ] Legenda visibile e comprensibile, collassabile
- [ ] Refresh funzionante (manuale; auto opzionale)
- [ ] Stato visivo coerente con palette e pattern (non solo colore)
- [ ] Accessibilità base (focus, ARIA, contrasto) rispettata
- [ ] Fallback Lista attivo per XS
- [ ] Tablet/desktop con layout adattivo (legenda/pannello laterale)

---

Appendice A – Esempio JSON API (indicativo)

GET /api/desks
[
  { "id": "A1", "status": "FREE", "label": "A1", "features": ["window"] },
  { "id": "A2", "status": "BUSY", "label": "A2", "busyUntil": "2026-01-18T15:30:00Z" },
  { "id": "A3", "status": "UNAVAILABLE", "label": "A3" }
]

Mapping stato:
- FREE → Libero
- BUSY → Occupato
- UNAVAILABLE → Non disponibile

Note: la definizione effettiva dell’API potrà essere allineata ai moduli backend quando disponibili.
