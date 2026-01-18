import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '../Navigation';
import { SelectedDateProvider } from '../../context/SelectedDateContext';

/**
 * DashboardShell renders a persistent layout with outlet area and bottom navigation.
 * It also provides SelectedDateProvider so the selected date is shared across child routes.
 */
export const DashboardShell: React.FC = () => {
  return (
    <SelectedDateProvider>
      <div style={styles.shell}>
        <main style={styles.main}>
          <Outlet />
        </main>
        <BottomNavigation basePath="" />
      </div>
    </SelectedDateProvider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  shell: {
    position: 'relative',
    minHeight: '100vh',
    background: '#f9fafb',
    paddingBottom: 56, // reserve space for bottom nav
  },
  main: {
    paddingBottom: 16,
  },
};

export default DashboardShell;
