import request from 'supertest';
import { app } from '../../src/server';

describe('POST /api/auth/refresh and /api/auth/logout', () => {
  it('should return 400 for missing refresh token', async () => {
    await request(app).post('/api/auth/refresh').send({}).expect(400);
  });

  it('should issue new access token using valid refresh token and then revoke on logout', async () => {
    const email = `refresh_${Date.now()}@example.com`;
    const password = 'ValidP@ssw0rd!';

    const signup = await request(app).post('/api/auth/signup').send({ email, password }).expect(201);
    expect(signup.body?.email).toBe(email.toLowerCase());

    const login = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    const refreshToken = login.body.refreshToken as string;
    expect(typeof refreshToken).toBe('string');

    const refresh = await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(200);
    expect(typeof refresh.body.accessToken).toBe('string');

    await request(app).post('/api/auth/logout').send({ refreshToken }).expect(204);

    // After logout, refresh should fail (revoked)
    await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });
});
