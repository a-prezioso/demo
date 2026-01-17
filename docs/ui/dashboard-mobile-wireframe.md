# Dashboard con mappa delle 12 postazioni — Mobile-first

Stato: proposta UI/UX (low-fidelity wireframe) — v1.0
Autore: Team UX/Frontend
Obiettivo: definire struttura e comportamento della dashboard per visualizzare e interagire con la mappa delle 12 postazioni, ottimizzata per mobile.


## 1) Layout principale

Elementi chiave:
- Header: titolo schermata, azioni globali (refresh), eventuale accesso al menu/profilo.
- Area mappa: griglia di 12 nodi (postazioni) interattivi. Rappresentazione semplice con forme e colori di stato.
- Legenda / status bar: codifica colori (Libero, Occupato, Non disponibile) + timestamp "Ultimo aggiornamento".
- Pulsante di refresh: azione primaria per ricaricare stato (come icona nell'header; opzionalmente FAB su mobile).
- Pannello dettagli (mobile: bottom sheet / drawer) quando si seleziona una postazione.

Gerarchia visiva (mobile-first):
- Header sticky
- Mappa con aspect ratio stabile (ad es. 1:1) per evitare jump layout
- Legenda compatta subito sotto la mappa
- Pannello dettagli sovrapposto quando aperto


## 2) Wireframe (low-fidelity)

Mobile (portrait ~360–420px)

+--------------------------------------------------+
|  Header                                          |
|  <  Mappa postazioni             ⟳  (Refresh)    |
+--------------------------------------------------+
|                                                  |
|  [S01] [S02] [S03]                               |
|  [S04] [S05] [S06]         (griglia 3 x 4)       |
|  [S07] [S08] [S09]                               |
|  [S10] [S11] [S12]                               |
|                                                  |
+--------------------------------------------------+
|  ● Libero   ● Occupato   ▨ Non disp.   10:21     |
+--------------------------------------------------+
|  Bottom sheet (quando selezionata una postaz.)   |
|  ──────────────────────────────────────────────   |
|   S05 — Sala A                                   |
|   Stato: Occupato (da 09:15)                     |
|   Note: ...                                      |
|   [Prenota]  [Dettagli]                          |
+--------------------------------------------------+

Legenda simboli: [Sxx] = nodo postazione; ●/▨ = indicatori stato; ⟳ = refresh.

Tablet (landscape ≥768px)

+----------------------+---------------------------+
| Header                                            |
+----------------------+---------------------------+
|   Mappa (4 x 3)      |  Pannello dettagli        |
|  [S01][S02][S03][S04]|  (persistente)            |
|  [S05][S06][S07][S08]|  Sxx, stato, azioni       |
|  [S09][S10][S11][S12]|                           |
+----------------------+---------------------------+
| ● Libero  ● Occupato  ▨ Non disp.   Ultimo agg…  |
+--------------------------------------------------+

Desktop (≥1024px)

- Mappa centrata (6 x 2) o 4 x 3 con maggior spaziatura
- Pannello dettagli laterale sempre visibile a destra


## 3) Comportamento responsive

Breakpoints minimi (suggeriti, non vincolanti al framework):
- < 360px: fallback lista (vedi §8)
- ≥ 360px e < 768px: mobile portrait, griglia 3 x 4, bottom sheet per dettagli
- ≥ 768px e < 1024px: tablet/landscape, griglia 4 x 3, pannello dettagli laterale
- ≥ 1024px: desktop, griglia 4 x 3 o 6 x 2, pannello laterale fisso

Ridimensionamento nodi:
- Ogni nodo postazione ha min-size touch 44x44px (WCAG) e cresce/fluisce con la griglia
- Label breve (S01…S12) sempre visibile; stato come colore+icona


## 4) Interazioni minime lato utente

- Tap/click su postazione:
  - Mobile: apre bottom sheet con info base (ID, nome/area, stato con timestamp, note opzionali)
  - Tablet/desktop: evidenzia selezione e popola pannello laterale
- Azioni nel pannello:
  - "Prenota": pulsante primario → link a pagina esistente (es. /booking?station=S05)
  - "Dettagli": link a pagina di dettaglio (se prevista) o stesso anchor in futuro
- Aggiornamento stato:
  - Pulsante di refresh (header). Opzionale: pull-to-refresh su mobile (se PWA)
- Focus/Keyboard:
  - Ogni nodo è focusable (tabindex=0) e attivabile con Enter/Space
  - Outline visibile in focus
- Feedback:
  - Loading: skeleton placeholders dei nodi
  - Error: banner non intrusivo con [Riprova]
  - Ultimo aggiornamento visibile nella legenda/status bar


## 5) Palette colori e codifica visiva (accessibile)

Obiettivi: alta distinguibilità cromatica; non affidarsi solo al colore.

Stati:
- Libero: verde accessibile
  - Colore: #16A34A (Green 600)
  - Icona: ✓ (check)
  - Pattern: pieno
- Occupato: arancione/ambra
  - Colore: #F59E0B (Amber 500)
  - Icona: ⏳/👤 (timer/persona)
  - Pattern: puntinato leggero opzionale
- Non disponibile: grigio con pattern
  - Colore: #6B7280 (Gray 500)
  - Icona: ⛔/— (divieto/dash)
  - Pattern: diagonali ▨ per aumentare distinguibilità

Testo/simboli su sfondo stato:
- Colore testo in overlay: #111827 (Gray 900) oppure #FFFFFF con outline/border per contrasto > 4.5:1
- Bordo esterno ad alto contrasto: #111827 al 20–30% di opacità o #1F2937 (Gray 800)

Indicazioni di accessibilità:
- Ogni nodo ha aria-label: "Postazione S05 — Occupato" e aria-describedby con tempo ultimo aggiornamento
- Legenda include testo esplicito (non solo colore)
- Contrasto minimo WCAG AA per testo/indicatori

CSS tokens (proposta):
:root {
  --color-available: #16A34A;
  --color-busy: #F59E0B;
  --color-unavailable: #6B7280;
  --color-border: #1F2937;
  --color-text-on: #FFFFFF;
}


## 6) Struttura componenti (suggerimento per implementazione React)

- DashboardPage
  - HeaderBar (titolo + icone azione: refresh)
  - StationsMap
    - Grid 3x4/4x3/6x2 responsive via CSS Grid
    - StationNode x12 (props: id, name, status, selected)
  - LegendBar (stati + ultimo aggiornamento)
  - StationDetail (BottomSheet su mobile, SidePanel su tablet/desktop)
  - RefreshButton (opzionale FAB su mobile, altrimenti in Header)

Routing/integrazione attesa:
- Rotta: /dashboard
- Azione Prenota → /booking?station=Sxx (già esistente o da collegare)

Dati minimi per ciascuna postazione:
- id: string (S01…S12)
- name: string breve (opzionale)
- status: 'available' | 'busy' | 'unavailable'
- updatedAt: ISO string


## 7) Stati di sistema (loading, errore, vuoto)

- Loading: placeholder circolari/quadrati 12, shimmer o opacità ridotta
- Error: banner in alto con testo "Impossibile aggiornare lo stato" + [Riprova]
- Vuoto (improbabile): messaggio "Nessuna postazione disponibile"


## 8) Fallback per schermi molto piccoli (<320px) o modalità ridotta

- Switch Mappa/Lista nella barra superiore della mappa
- Vista Lista:
  - Riga compatta per postazione: [●] S01 — Libero  (10:21) [Prenota]
  - Ordine: Libere in alto, poi Occupate, poi Non disponibili
- Preferire testo e icone rispetto al solo colore


## 9) Specifica interazioni e microcopy

- Titolo: "Mappa postazioni"
- Legenda: "Libero", "Occupato", "Non disponibile" (evitare ambiguità)
- Pulsante refresh: label accessibile aria-label="Aggiorna stato postazioni"
- Bottom sheet: azione primaria "Prenota", azione secondaria "Dettagli"


## 10) Linee guida tecniche (per implementazione)

- Layout: CSS Grid per la mappa, minmax per sizing; evitare dipendenza da librerie pesanti
- Rappresentazione nodi: preferibile SVG inline per facilità di iconografia e pattern
- Animazioni: transizioni 150–200ms su fill/border; evitare animazioni su layout
- Performance: 12 nodi → nessun problema; throttling per refresh (min 1s)
- Accessibilità: focus, aria, touch target >=44px, high-contrast friendly
- Test: snapshot visivi (Percy/Storybook) e interazione base (tap/keyboard)


## 11) Esempio di markup (indicativo)

<section class="dashboard">
  <header class="header">
    <h1>Mappa postazioni</h1>
    <button class="icon-btn" aria-label="Aggiorna stato postazioni">⟳</button>
  </header>
  <div class="map">
    <!-- 12 nodi -->
    <button class="node available" aria-label="Postazione S01 — Libero">S01</button>
    <!-- ... -->
  </div>
  <div class="legend">
    <span><i class="dot available"></i> Libero</span>
    <span><i class="dot busy"></i> Occupato</span>
    <span><i class="dot unavailable"></i> Non disponibile</span>
    <time>10:21</time>
  </div>
  <!-- Bottom sheet/side panel a seconda del breakpoint -->
</section>

CSS grid (indicativo):
.map {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
@media (min-width: 768px) { .map { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 1024px) { .map { grid-template-columns: repeat(6, 1fr); } }


## 12) Checklist di accettazione

- [ ] La dashboard si apre su mobile con griglia 3x4 e header sticky
- [ ] Ogni postazione è tappabile e apre pannello con info e pulsanti
- [ ] Legenda presente con tre stati + timestamp ultimo aggiornamento
- [ ] Pulsante refresh visibile e funzionante
- [ ] Colori/stati distinguibili anche con simulatore daltonismo
- [ ] Touch target >=44x44px; focus visibile e navigabile da tastiera
- [ ] Fallback lista disponibile <320px
- [ ] Responsività: tablet con pannello laterale, desktop con layout più ampio


Note future:
- Possibile integrazione geolocalizzazione indoor o heatmap (non previsto ora)
- Possibile evidenziare postazione preferita dell’utente (profilo)
