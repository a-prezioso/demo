# UI/UX Spec – Dashboard Mappa 12 Postazioni (Mobile‑First)

Versione: 1.0
Data: 18/01/2026
Autore: UX/Frontend Team
Stato: Draft

---

Sintesi obiettivi
- Mobile‑first, interazioni minime chiare.
- Stati visivi coerenti e accessibili per libero/occupato/non disponibile.
- Responsive: adattamento a tablet/desktop con pannelli laterali.

Layout
- Header sticky con titolo “Dashboard” e azioni: Refresh (icona), eventualmente filtro.
- Area mappa SVG con 12 marker interattivi, controlli zoom (+/−) in basso a destra.
- Legenda collassabile sopra la mappa su mobile; sidebar a sinistra su tablet/desktop.
- Bottom sheet informativo su tap marker con CTA “Prenota” e “Dettagli”.

Interazioni
- Tap marker → apre bottom sheet; seconda azione su CTA.
- Long‑press (opzionale) → mostra tooltip con stato rapido.
- Pull‑to‑refresh (opzionale su PWA) o pulsante Refresh.
- Auto‑refresh opzionale ogni 30s.

Accessibilità
- Target 44x44px, focus visibile, aria‑label descrittivi.
- Pattern/icone oltre al colore per distinguere stati.

Colori
- Libero: #1F8A3A + icona ✓
- Occupato: #C53D3D + icona ●/👤
- Non disponibile: #6B7280 + icona 🔒
- Outline marker: #111827; focus: #2563EB; sfondo mappa: #F9FAFB.

Fallback XS (<360px)
- Toggle Mappa/Lista; lista compatta delle 12 postazioni con icona stato e CTA.

Deliverable aggiuntivi
- Wireframe ASCII: docs/wireframes/dashboard-mobile-wireframes.txt
- Specifica completa: docs/dashboard-mobile-first.md
