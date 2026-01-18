BookingStatusBadge component

- Props
  - state: backend state (ATTIVA | PASSATA | CANCELLATA | string)
  - size: 'sm' | 'md' (default md)
  - withIcon: boolean (default true)
  - className: additional classes
  - label: optional label override
  - t: optional translation function (key, vars) => string

- Accessibility
  - role="status", aria-label and title include localized state
  - High-contrast defaults; integrate with design tokens for WCAG AA

- Styling
  - CSS variables for tones: success, danger, neutral
  - See BookingStatusBadge.css

- i18n keys
  - booking.state.ATTIVA | PASSATA | CANCELLATA | UNKNOWN
  - booking.badge.aria
