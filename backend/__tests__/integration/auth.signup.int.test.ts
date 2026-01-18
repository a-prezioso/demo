import request from 'supertest';
import { app } from '../../src/server';
import { authRouter } from '../../src/modules/user/interfaces/http/authRoutes';
import { InMemoryUserRepository } from '../../src/modules/user/repository/UserRepository';

// We will interact through HTTP against the Express app.
// The current implementation uses an InMemoryUserRepository inside the router module.
// To observe side effects, we indirectly validate via HTTP responses and
// use behavioral expectations (201, 409, etc.).

// Note: supertest is required as devDependency for integration tests.
// We'll add it in package.json devDependencies.

describe('POST /api/auth/signup (integration)', () => {
  beforeEach(() => {
    // Reset any internal state if accessible. The router uses its own repository instance,
    // so we can't clear it directly. The tests will use unique emails to avoid cross-test leaks.
    // If repository exposes test hooks, they would be used here.
  });

  it('should create a new user with valid email and password, returning 201 and non-sensitive response', async () => {
    const email = `user_${Date.now()}@example.com`;
    const password = 'ValidP@ssw0rd!';

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email, password })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(typeof res.body.id).toBe('string');
    expect(res.body.email).toBe(email.toLowerCase());
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.salt).toBeUndefined();
    expect(new Date(res.body.createdAt).getTime()).toBeGreaterThan(0);
    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(0);
  });

  it('should return 409 when email already exists', async () => {
    const email = `dup_${Date.now()}@example.com`;
    const password = 'ValidP@ssw0rd!';

    await request(app).post('/api/auth/signup').send({ email, password }).expect(201);
    const res = await request(app).post('/api/auth/signup').send({ email, password }).expect(409);

    expect(res.body).toEqual({ error: 'Email already registered' });
  });

  it('should return 400 for missing payload or incomplete fields', async () => {
    await request(app).post('/api/auth/signup').send(undefined as any).expect(400);
    await request(app).post('/api/auth/signup').send({}).expect(400);
    await request(app).post('/api/auth/signup').send({ email: 'a@example.com' }).expect(400);
    await request(app).post('/api/auth/signup').send({ password: 'ValidP@ssw0rd!' }).expect(400);
  });

  it('should return 400 for invalid email or weak password', async () => {
    const cases = [
      { email: 'invalid-email', password: 'ValidP@ssw0rd!' },
      { email: 'user@example.com', password: 'short' },
    ];

    for (const c of cases) {
      const res = await request(app).post('/api/auth/signup').send(c).expect(400);
      expect(res.body).toEqual({ error: 'Invalid input' });
    }
  });

  it('should not expose sensitive fields in any error response', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'bad', password: 'short' })
      .expect(400);

    expect(JSON.stringify(res.body)).not.toMatch(/password|hash|salt/i);
  });

  it('should respond 500 on simulated DB error', async () => {
    // This test relies on a testing hook. Since the router encapsulates its repository instance,
    // we cannot trigger a failure directly here. As a pragmatic approach in this skeleton, we
    // simulate by temporarily creating a route that triggers the error via repository hook if available.
    // Instead, we verify the global 500 path by sending a valid request after monkey-patching
    // the repository create method at runtime.

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const repoModule = require('../../src/modules/user/repository/UserRepository');
    const original = repoModule.InMemoryUserRepository.prototype.create;
    repoModule.InMemoryUserRepository.prototype.create = async () => {
      throw new Error('Simulated repository failure');
    };

    const email = `fail_${Date.now()}@example.com`;
    const password = 'ValidP@ssw0rd!';

    const res = await request(app).post('/api/auth/signup').send({ email, password }).expect(500);
    expect(res.body).toEqual({ error: 'Internal server error' });

    // restore
    repoModule.InMemoryUserRepository.prototype.create = original;
  });
});
