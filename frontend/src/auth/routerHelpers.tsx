import React from 'react';
import { useAuth } from './AuthContext';

export interface DefaultRedirectorProps {
  to: string;
}

// Simple component that navigates by replacing window.location (router-agnostic fallback)
export const DefaultRedirector: React.FC<DefaultRedirectorProps> = ({ to }) => {
  if (typeof window !== 'undefined') {
    window.location.replace(to);
  }
  return null;
};

// Higher-level guard using AuthContext. Router-agnostic: consumer provides redirect component factory.
export const WithAuthGuard: React.FC<{ element: React.ReactNode; toLogin?: string; Redirector?: React.FC<DefaultRedirectorProps> }>
= ({ element, toLogin = '/login', Redirector = DefaultRedirector }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirector to={toLogin} />;
  return <>{element}</>;
};

// If already authenticated, avoid showing auth screens and redirect to app home
export const IfAuthenticatedRedirect: React.FC<{ element: React.ReactNode; to?: string; Redirector?: React.FC<DefaultRedirectorProps> }>
= ({ element, to = '/app', Redirector = DefaultRedirector }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Redirector to={to} />;
  return <>{element}</>;
};
