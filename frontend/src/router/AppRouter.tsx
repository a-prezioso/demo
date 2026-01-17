import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth, AuthProvider } from '../context/AuthContext';
import ProfilePage from '../pages/ProfilePage';
import DashboardPostazioni from '../pages/DashboardPostazioni';

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
    <div style={{ padding: '1rem' }}>
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
    <div style={{ padding: '1rem' }}>
      <h1>Signup</h1>
      <button onClick={handleMockSignup}>Create account</button>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: 0 }}>Welcome {user?.email}</p>
        </div>
        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/dashboard">Mappa</Link>
          <Link to="/timesheet">Timesheet</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/profile">Profile</Link>
          <button onClick={logout} style={{ marginLeft: '0.5rem' }}>Logout</button>
        </nav>
      </header>

      {/* Mappa delle postazioni */}
      <DashboardPostazioni onPrenota={(s) => { /* placeholder: navigate booking */ alert(`Vai a prenotare ${s.name}`); }} />
    </div>
  );
};

const TimesheetPage: React.FC = () => <div style={{ padding: '1rem' }}><h1>Timesheet</h1></div>;
const ProjectsPage: React.FC = () => <div style={{ padding: '1rem' }}><h1>Projects</h1></div>;

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
      <Route path="/profile" element={<ProfilePage />} />
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
