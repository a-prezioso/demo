import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { SelectedDateProvider } from '../context/SelectedDateContext';

// ProtectedLayout: wraps protected pages with persistent bottom navigation
// The bottom nav is fixed; we add bottom padding to avoid overlap with page content.

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  paddingBottom: 80, // space for bottom nav (approx 56-64px + spacing)
  background: '#F9FAFB', // gray-50 background as app guideline
};

const ProtectedLayout: React.FC = () => {
  return (
    <div style={containerStyle}>
      <SelectedDateProvider>
        <Outlet />
        <BottomNavigation />
      </SelectedDateProvider>
    </div>
  );
};

export default ProtectedLayout;
