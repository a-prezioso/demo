import request from 'supertest';
import { app } from '../../src/server';
import { JwtService } from '../../src/core/jwt/jwtService';

describe('Profile endpoints /api/me', () => {
  const jwt = new JwtService();

  it('should return 401 without token', async () => {
    await request(app).get('/api/me').expect(401);
  });

  it('should return empty profile for new user and allow update', async () => {
    const { token } = jwt.signAccess({ sub: 'u42', email: 'u42@example.com', roles: ['user'] });

    const get1 = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(get1.body).toEqual({ userId: 'u42', firstName: null, lastName: null, avatarUrl: null });

    const upd = await request(app)
      .put('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Mario', lastName: "Rossi", avatarUrl: 'https://example.com/a.png' })
      .expect(200);

    expect(upd.body.userId).toBe('u42');
    expect(upd.body.firstName).toBe('Mario');
    expect(upd.body.lastName).toBe('Rossi');
    expect(upd.body.avatarUrl).toBe('https://example.com/a.png');

    const get2 = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(get2.body.firstName).toBe('Mario');
    expect(get2.body.lastName).toBe('Rossi');
  });

  it('should validate inputs and return 400 for invalid payloads', async () => {
    const { token } = jwt.signAccess({ sub: 'u99', email: 'u99@example.com', roles: ['user'] });

    await request(app)
      .put('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 123 })
      .expect(400);

    await request(app)
      .put('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarUrl: 'ftp://invalid' })
      .expect(400);

    await request(app)
      .put('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ unknown: 'x' })
      .expect(400);
  });
});
