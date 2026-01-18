// Minimal Express server wiring the auth routes
// This bootstraps the HTTP API without exposing sensitive data in logs.

import express from 'express';
import { authRouter } from './modules/user/interfaces/http/authRoutes';
import { logger } from './core/logging/logger';

const app = express();
app.use(express.json());

// Base path for API
app.use('/api/auth', authRouter);

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
