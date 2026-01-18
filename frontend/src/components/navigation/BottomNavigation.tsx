import React, { useMemo } from 'react';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
}

export interface BottomNavigationProps {
  items?: NavItem[];
  currentPath?: string;
  onNavigate?: (href: string) => void;
  className?: string;
}

// Minimal inline styles to avoid external CSS dependency
const styles = {
  container: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    background: '#ffffff',
    borderTop: '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    zIndex: 1000,
  },
  item: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: '#333',
    fontSize: 12,
    lineHeight: 1.2,
    outline: 'none',
    padding: '6px 4px',
    gap: 4,
  },
  itemActive: {
    color: '#0b74de',
    fontWeight: 600,
  },
  icon: {
    width: 22,
    height: 22,
    display: 'block',
  },
  spacer: {
    // to avoid content hidden under the bar; consumer can also add padding-bottom
    height: 56,
  },
};

// Simple default icons (SVG)
const MapIcon = ({ active }: { active?: boolean }) => (
  <svg
    aria-hidden="true"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ ...styles.icon, color: active ? '#0b74de' : '#666' }}
  >
    <path d="M9 18l-5 2V6l5-2 6 2 5-2v14l-5 2-6-2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const BookingsIcon = ({ active }: { active?: boolean }) => (
  <svg
    aria-hidden="true"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ ...styles.icon, color: active ? '#0b74de' : '#666' }}
  >
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

function isActive(href: string, pathname: string): boolean {
  if (!href || !pathname) return false;
  if (href === '/') return pathname === '/';
  // consider active if pathname equals or starts with href segment
  return pathname === href || pathname.startsWith(href + '/') || pathname.includes('prenot');
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  currentPath,
  onNavigate,
  className,
}) => {
  const pathname = currentPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  const defaultItems = useMemo<NavItem[]>(
    () => [
      { key: 'map', label: 'Mappa', href: '/dashboard', ariaLabel: 'Vai alla mappa', icon: <MapIcon active={isActive('/dashboard', pathname)} /> },
      {
        key: 'bookings',
        label: 'Le mie prenotazioni',
        href: '/le-mie-prenotazioni',
        ariaLabel: 'Vai alle mie prenotazioni',
        icon: <BookingsIcon active={isActive('/le-mie-prenotazioni', pathname)} />,
      },
    ],
    [pathname]
  );

  const navItems = items ?? defaultItems;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Prefer SPA navigation using history API
    e.preventDefault();
    try {
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        const prev = window.location.pathname + window.location.search + window.location.hash;
        window.history.pushState({}, '', href);
        const event = new PopStateEvent('popstate', { state: {} });
        window.dispatchEvent(event);
        if (onNavigate) onNavigate(href);
        // If no router is listening, and path didn't change, fallback
        const now = window.location.pathname + window.location.search + window.location.hash;
        if (prev === now) {
          window.location.href = href;
        }
      } else {
        window.location.href = href;
      }
    } catch {
      window.location.href = href;
    }
  };

  return (
    <nav role="navigation" aria-label="Navigazione principale" className={className} style={styles.container as React.CSSProperties}>
      {navItems.map((item) => {
        const active = isActive(item.href, pathname);
        return (
          <a
            key={item.key}
            href={item.href}
            aria-label={item.ariaLabel || item.label}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => handleClick(e, item.href)}
            style={{
              ...(styles.item as React.CSSProperties),
              ...(active ? (styles.itemActive as React.CSSProperties) : {}),
            }}
          >
            <span aria-hidden="true">{item.icon ?? (item.key === 'map' ? <MapIcon active={active} /> : <BookingsIcon active={active} />)}</span>
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
