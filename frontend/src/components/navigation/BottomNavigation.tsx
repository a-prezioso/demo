import React from 'react';
import { useRouter, Link } from '../../lib/router';
import { useSelectedDate } from '../../lib/date/SelectedDateContext';

export interface BottomNavigationProps {
  onNavigate?: (href: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onNavigate }) => {
  const { navigate, currentPath } = useRouter();
  const { date } = useSelectedDate();

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
    onNavigate && onNavigate(href);
  };

  const mkHref = (base: string) => {
    const u = new URL(window.location.origin + base);
    if (date) u.searchParams.set('date', date);
    return u.pathname + u.search;
  };

  return (
    <nav className="sd-bottom-nav" role="navigation" aria-label="Navigazione">
      <Link href={mkHref('/dashboard')} onClick={go(mkHref('/dashboard'))} aria-current={currentPath.startsWith('/dashboard') ? 'page' : undefined}>
        Mappa
      </Link>
      <Link href={mkHref('/le-mie-prenotazioni')} onClick={go(mkHref('/le-mie-prenotazioni'))} aria-current={currentPath.startsWith('/le-mie-prenotazioni') ? 'page' : undefined}>
        Le mie prenotazioni
      </Link>
    </nav>
  );
};
