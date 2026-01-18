import React from 'react';

// Lightweight interface to avoid coupling to a specific router implementation.
// Apps can adapt by wrapping this around their routing solution.
export interface ProtectedRouteProps {
  isAuthenticated: boolean;
  redirect: (to: string, state?: any) => React.ReactNode; // function that returns a redirect element
  element: React.ReactNode; // the protected element to render
  toLogin?: string; // default '/login'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, redirect, element, toLogin = '/login' }) => {
  if (!isAuthenticated) {
    return <>{redirect(toLogin)}</>;
  }
  return <>{element}</>;
};

export default ProtectedRoute;
