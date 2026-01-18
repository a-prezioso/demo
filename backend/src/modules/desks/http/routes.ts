import { Router } from 'express';
import { DeskController } from './DeskController';
import type { IDeskRepository } from '../repository/DeskRepository';

// Registers desk status routes under /api/postazioni
// Example usage in app: app.use('/', registerDeskRoutes(express.Router(), new InMemoryDeskRepository()))
export function registerDeskRoutes(router: Router, repo: IDeskRepository): Router {
  const ctrl = DeskController.build(repo);

  // GET /api/postazioni/status
  router.get('/api/postazioni/status', ctrl.getStatuses);

  return router;
}
