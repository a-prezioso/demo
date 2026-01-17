import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth, AuthProvider } from '../context/AuthContext';

// Placeholder pages: in a real app, replace with actual components
const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleMockLogin = () => {
    login({
      tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
      user: { id: '1', email: 'mock@example.com' },
    });
    navigate(from, { replace: true });
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleMockLogin}>Login</button>
    </div>
  );
};

const SignupPage: React.FC = () => {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const redirectTo = location.state?.redirectTo || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleMockSignup = () => {
    signup({
      tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
      user: { id: '2', email: 'new@example.com' },
    });
    navigate(redirectTo, { replace: true });
  };

  return (
    <div>
      <h1>Signup</h1>
      <button onClick={handleMockSignup}>Create account</button>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {user?.email}</p>
      <a href="/timesheet">Timesheet</a> | <a href="/projects">Projects</a>
      <div>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

const TimesheetPage: React.FC = () => <div><h1>Timesheet</h1></div>;
const ProjectsPage: React.FC = () => <div><h1>Projects</h1></div>;

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    {/* Public routes */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />

    {/* Protected routes wrapper */}
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/timesheet" element={<TimesheetPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const AppRouter: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default AppRouter;
