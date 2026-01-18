# Frontend – Dashboard Mappa (12 postazioni)

Questo README descrive i componenti previsti per implementare la dashboard mobile‑first con mappa interattiva.

Struttura proposta:

frontend/src/features/dashboard/
- pages/DashboardPostazioni.tsx
- pages/index.ts
- components/SeatMap.tsx
- components/SeatMarker.tsx
- components/Legend.tsx
- components/InfoBottomSheet.tsx
- components/RefreshButton.tsx
- api/dashboardApi.ts
- types.ts
- styles.css

Linee guida UI/UX: vedi docs/dashboard-mobile-first.md e docs/ui-ux/dashboard-ui-spec.md

Uso rapido:

- Importa lo stile globale della feature (idealmente in App.tsx):
  import "./features/dashboard/styles.css";

- Monta la pagina dove necessario:
  import { DashboardPostazioni } from "./features/dashboard/pages";
  ...
  <Route path="/dashboard" element={<DashboardPostazioni />} />

API attesa:
- GET /api/dashboard/seats → [{ id, name, status, description? }]
  dove status ∈ { FREE | BUSY | UNAVAILABLE }

Note accessibilità:
- target touch ≥ 44px, focus visibile, aria-label sui marker, ruoli grid/gridcell sulla mappa.
