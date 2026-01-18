SmartDesk Frontend - App bootstrap

This repo uses a lightweight custom router (RouterProvider) and a persistent BottomNavigation component to allow SPA-like navigation between the Map dashboard and the "Le mie prenotazioni" section.

Main pieces added:
- src/lib/router/RouterProvider.tsx: simple client-side router based on history API and popstate
- src/components/navigation/BottomNavigation.tsx: accessible bottom navigation with two items (Mappa, Le mie prenotazioni)
- src/components/bookings/MyBookings.tsx: basic bookings list screen
- src/App.tsx: app shell rendering Routes and BottomNavigation so the bar persists across pages

Accessibility:
- nav element with role="navigation" and aria-label
- aria-current set on active item
- focusable anchors with clear labels

Styling:
- Minimal inline styles; can be swapped with your design system

Routing:
- SPA navigation using pushState without full reloads; if not supported, falls back to location.href
