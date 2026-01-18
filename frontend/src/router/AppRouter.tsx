import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from '../components/Auth/AuthPage';
import { useAuthContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import { DashboardPage } from '../components/Dashboard/DashboardPage';
import { MyBookingsPage } from '../components/Bookings/MyBookingsPage';
import { DashboardShell } from '../components/Dashboard/DashboardShell';

// Wrapper around AuthPage that handles redirection if already authenticated
const AuthPageWrapper: React.FC<{ baseUrl?: string }> = ({ baseUrl = '/api' }) => {
  const { state } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation() as any;

  // If already logged in, redirect to dashboard
  if (state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSuccess = () => {
    // after successful login, redirect to previous requested route if provided
    const from = location?.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  return <AuthPage baseUrl={baseUrl} onSuccess={onSuccess} />;
};

export type AppRouterProps = { baseUrl?: string };

export const AppRouter: React.FC<AppRouterProps> = ({ baseUrl = '/api' }) => {
  const { state } = useAuthContext();
  const routerBase = useMemo(() => ({ baseUrl }), [baseUrl]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<AuthPageWrapper baseUrl={routerBase.baseUrl} />} />

        {/* Protected area with persistent layout and bottom navigation */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage baseUrl={routerBase.baseUrl} />} />
          <Route path="bookings" element={<MyBookingsPage />} />
        </Route>

        {/* Fallback: redirect unknown routes */}
        <Route path="*" element={<Navigate to={state.isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
