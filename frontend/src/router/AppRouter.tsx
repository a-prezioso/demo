import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from '../components/Auth/AuthPage';
import { useAuthContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Placeholder authenticated pages
const Dashboard: React.FC = () => {
  const { state, logout } = useAuthContext();
  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome {state.user?.email || 'user'}.</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

const Timesheet: React.FC = () => (
  <div style={{ padding: 24 }}>
    <h1>Timesheet</h1>
  </div>
);

const Projects: React.FC = () => (
  <div style={{ padding: 24 }}>
    <h1>Projects</h1>
  </div>
);

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

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timesheet"
          element={
            <ProtectedRoute>
              <Timesheet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        {/* Fallback: redirect unknown routes */}
        <Route path="*" element={<Navigate to={state.isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
