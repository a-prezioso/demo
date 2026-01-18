import request from 'supertest';
import { app } from '../../src/server';
import { JwtService } from '../../src/core/jwt/jwtService';

describe('JWT auth middleware for /api/private/**', () => {
  const jwt = new JwtService();

  it('should return 401 when Authorization header is missing', async () => {
    await request(app).get('/api/private/ping').expect(401);
  });

  it('should return 401 for malformed token', async () => {
    await request(app)
      .get('/api/private/ping')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('should allow access with valid token and attach user', async () => {
    const { token } = jwt.signAccess({ sub: 'u1', email: 'u1@example.com', roles: ['user'] });
    const res = await request(app)
      .get('/api/private/ping')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body?.pong).toBe(true);
    expect(res.body?.userId).toBe('u1');
  });

  it('should return 403 when roles are insufficient on admin route', async () => {
    const { token } = jwt.signAccess({ sub: 'u2', email: 'u2@example.com', roles: ['user'] });
    await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
