import { Router } from 'express';
import type { IUserRepository } from '../repository/UserRepository';
import { AuthController } from './AuthController';

// Registers auth routes on the provided router under /api/auth
// Example: router -> app, use app.use('/', registerAuthRoutes(router, repo))
export function registerAuthRoutes(router: Router, usersRepo: IUserRepository): Router {
  const ctrl = AuthController.build(usersRepo);

  router.post('/api/auth/signup', ctrl.signup);
  router.post('/api/auth/login', ctrl.login);

  return router;
}
