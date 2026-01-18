import request from 'supertest';
import { app } from '../../../src/server';
import { JwtService } from '../../../src/core/jwt/jwtService';

describe('Protected endpoints integration', () => {
  const jwt = new JwtService();

  it('should return 401 without token', async () => {
    await request(app).get('/api/private/ping').expect(401);
  });

  it('should return 200 with valid token', async () => {
    const { token } = jwt.signAccess({ sub: 'u123', email: 'u123@example.com', roles: ['user'] });

    const res = await request(app)
      .get('/api/private/ping')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body?.pong).toBe(true);
    expect(res.body?.userId).toBe('u123');
  });
});
