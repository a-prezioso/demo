import { User } from '../../../src/modules/user/domain/entities/User';

describe('User entity', () => {
  it('should create a new user with required fields and defaults', () => {
    const now = new Date();
    const user = User.createNew({
      id: 'b3f3a7c4-1234-5678-9abc-def012345678',
      email: 'USER@Example.com ' ,
      passwordHash: 'hash',
      salt: null,
    });

    expect(user.id).toBe('b3f3a7c4-1234-5678-9abc-def012345678');
    expect(user.email).toBe('user@example.com');
    expect(user.passwordHash).toBe('hash');
    expect(user.salt).toBeNull();
    expect(user.status).toBe('ACTIVE');
    expect(user.verificationToken).toBeNull();
    expect(user.verificationExpiresAt).toBeNull();
    expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
    expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it('should handle missing optional fields gracefully', () => {
    const user = User.createNew({
      id: '1',
      email: 'a@b.com',
      passwordHash: 'h',
    });
    expect(user.salt).toBeNull();
    expect(user.verificationToken).toBeNull();
    expect(user.verificationExpiresAt).toBeNull();
  });
});
