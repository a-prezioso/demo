import request from 'supertest';
import { app } from '../../src/server';

describe('POST /api/auth/login', () => {
  it('should return 400 for invalid input', async () => {
    await request(app).post('/api/auth/login').send({}).expect(400);
    await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'short' }).expect(400);
  });

  it('should allow login after successful signup with same in-memory repo', async () => {
    const email = `login_${Date.now()}@example.com`;
    const password = 'ValidP@ssw0rd!';

    const signup = await request(app).post('/api/auth/signup').send({ email, password }).expect(201);
    expect(signup.body?.email).toBe(email.toLowerCase());

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(res.body).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.tokenType).toBe('Bearer');
    expect(typeof res.body.expiresIn).toBe('number');
    expect(typeof res.body.refreshExpiresIn).toBe('number');
    expect(res.body.user.email).toBe(email.toLowerCase());
  });

  it('should return 401 for wrong password', async () => {
    const email = `wrong_${Date.now()}@example.com`;
    const password = 'ValidP@ssw0rd!';

    await request(app).post('/api/auth/signup').send({ email, password }).expect(201);

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'WrongPass123!' })
      .expect(401);
  });
});
