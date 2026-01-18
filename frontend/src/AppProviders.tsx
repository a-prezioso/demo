import React from 'react';
import { DesksStateProvider } from './lib/desksState';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <DesksStateProvider>{children}</DesksStateProvider>;
};

export default AppProviders;
