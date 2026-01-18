import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '../Navigation';

/**
 * DashboardShell renders a persistent layout with outlet area and bottom navigation.
 */
export const DashboardShell: React.FC = () => {
  return (
    <div style={styles.shell}>
      <main style={styles.main}>
        <Outlet />
      </main>
      <BottomNavigation basePath="" />
    </div>
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
