import React, { useEffect } from 'react';
import AppProviders from './AppProviders';
import { RouterProvider, useCurrentPath, useRouter } from './lib/router';
import { Dashboard as MapDashboard } from './components/dashboard/Dashboard';
import { MyBookings } from './components/bookings/MyBookings';
import { BottomNavigation } from './components/navigation/BottomNavigation';

function Routes() {
  const path = useCurrentPath();
  const { navigate } = useRouter();

  useEffect(() => {
    if (path === '/') {
      navigate('/dashboard');
    }
  }, [path, navigate]);

  const contentPadding = { paddingBottom: 72 } as React.CSSProperties;

  if (path.startsWith('/le-mie-prenotazioni')) {
    return (
      <div style={contentPadding}>
        <MyBookings />
      </div>
    );
  }

  return (
    <div style={contentPadding}>
      <MapDashboard />
    </div>
  );
}

export const App: React.FC = () => {
  return (
    <AppProviders>
      <RouterProvider>
        <Routes />
        <BottomNavigation onNavigate={(href) => { /* RouterProvider listens to popstate */ }} />
      </RouterProvider>
    </AppProviders>
  );
};

export default App;
