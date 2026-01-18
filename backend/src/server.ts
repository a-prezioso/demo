// Minimal Express server wiring the auth routes
// This bootstraps the HTTP API without exposing sensitive data in logs.

import express from 'express';
import { authRouter } from './modules/user/interfaces/http/authRoutes';
import { loginRouter } from './modules/auth/interfaces/http/loginRoute';
import { refreshRouter } from './modules/auth/interfaces/http/refreshRoutes';
import { logger } from './core/logging/logger';
import { requireAuth, requireRoles } from './core/jwt/authMiddleware';
import { JwtService } from './core/jwt/jwtService';
import { profileRouter } from './modules/user/interfaces/http/profileRoutes';

const app = express();
app.use(express.json());

// Base path for API
app.use('/api/auth', authRouter);
app.use('/api/auth', loginRouter);
app.use('/api/auth', refreshRouter);

// Profile routes
app.use('/api', profileRouter);

// Protected API group: apply JWT middleware to all /api/private/**
const jwt = new JwtService();
app.use('/api/private', requireAuth({ jwt }));

// Example protected routes pattern (for future reuse)
app.get('/api/protected/profile', requireAuth({ jwt }), (req, res) => {
  const user = (req as any).user;
  return res.status(200).json({ profile: { id: user?.id, email: user?.email, roles: user?.roles || [] } });
});

app.get('/api/admin/overview', requireRoles(['admin'], { jwt }), (req, res) => {
  return res.status(200).json({ ok: true });
});

// Example private route under /api/private
app.get('/api/private/ping', (req, res) => {
  const user = (req as any).user;
  return res.status(200).json({ pong: true, userId: user?.id });
});

// Health endpoint
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Global error handler safeguard (should rarely trigger as we handle per-route)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled server error');
  res.status(500).json({ error: 'Internal server error' });
});

// Export app for testing; optionally start server if run directly
export { app };

if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}
