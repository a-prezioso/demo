import express, { Request, Response } from 'express';
import request from 'supertest';
import { requireAuth } from '../../../src/core/jwt/authMiddleware';
import { JwtService } from '../../../src/core/jwt/jwtService';

describe('JWT auth middleware (unit)', () => {
  const buildApp = (jwt: JwtService) => {
    const app = express();
    app.get('/protected', requireAuth({ jwt }), (req: Request, res: Response) => {
      const user = (req as any).user;
      return res.status(200).json({ ok: true, user });
    });
    app.get('/roles', requireAuth({ jwt, roles: ['admin'] }), (_req: Request, res: Response) => {
      return res.status(200).json({ ok: true });
    });
    return app;
  };

  it('should allow access with valid token and propagate user/roles', async () => {
    const jwt = new JwtService({ secret: 's1', issuer: 'unit.iss', audience: 'unit.aud', accessTtlSec: 60 });
    const app = buildApp(jwt);

    const { token } = jwt.signAccess({ sub: 'u1', email: 'u1@example.com', roles: ['user', 'admin'] });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe('u1');
    expect(res.body.user.email).toBe('u1@example.com');
    expect(res.body.user.roles).toEqual(expect.arrayContaining(['user', 'admin']));

    // roles route should pass because token has 'admin'
    await request(app)
      .get('/roles')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('should return 401 when token is missing', async () => {
    const jwt = new JwtService({ secret: 's1', issuer: 'unit.iss', audience: 'unit.aud' });
    const app = buildApp(jwt);

    await request(app).get('/protected').expect(401);
  });

  it('should return 401 for invalid signature', async () => {
    const jwt = new JwtService({ secret: 's1', issuer: 'unit.iss', audience: 'unit.aud' });
    const app = buildApp(jwt);

    // token signed with different secret
    const other = new JwtService({ secret: 's2', issuer: 'unit.iss', audience: 'unit.aud' });
    const { token } = other.signAccess({ sub: 'u1', email: 'u1@example.com', roles: ['user'] });

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('should return 401 for expired token', async () => {
    const jwt = new JwtService({ secret: 's1', issuer: 'unit.iss', audience: 'unit.aud', accessTtlSec: 1 });
    const app = buildApp(jwt);

    // issue token with past iat so that exp is in the past
    const nowSec = Math.floor(Date.now() / 1000) - 120; // 2 minutes ago
    const { token } = jwt.signAccess({ sub: 'u1', email: 'u1@example.com' }, nowSec);

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(res.body.error === 'token_expired' || res.body.error === 'invalid_token').toBe(true);
  });

  it('should return 401 for wrong issuer or audience', async () => {
    const jwt = new JwtService({ secret: 's1', issuer: 'unit.iss', audience: 'unit.aud' });
    const app = buildApp(jwt);

    // same secret but different issuer
    const wrongIss = new JwtService({ secret: 's1', issuer: 'wrong.iss', audience: 'unit.aud' });
    const { token: tokenWrongIss } = wrongIss.signAccess({ sub: 'u1', email: 'u1@example.com' });

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${tokenWrongIss}`)
      .expect(401);

    // different audience
    const wrongAud = new JwtService({ secret: 's1', issuer: 'unit.iss', audience: 'wrong.aud' });
    const { token: tokenWrongAud } = wrongAud.signAccess({ sub: 'u1', email: 'u1@example.com' });

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${tokenWrongAud}`)
      .expect(401);
  });
});
