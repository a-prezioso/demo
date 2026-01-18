import { Router } from 'express';
import type { IDesksRepository } from '../repository/DesksRepository';
import { DesksController } from './DesksController';

export function registerDeskRoutes(router: Router, repo: IDesksRepository): Router {
  const ctrl = DesksController.build(repo);
  router.get('/api/desks', ctrl.getDesks);
  return router;
}
