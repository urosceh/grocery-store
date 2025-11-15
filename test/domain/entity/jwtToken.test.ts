import jwt from 'jsonwebtoken';

const importJwtClass = async () => {
  const mod = await import('../../../src/domain/entity/JwtToken');
  return mod.JwtUserToken;
};

const ORIGINAL_ENV = { ...process.env };

describe('JwtUserToken', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('sign and verify roundtrip', async () => {
    process.env.JWT_SECRET = 'secret123';
    process.env.JWT_EXPIRES_IN = '3600';
    const JwtUserToken = await importJwtClass();
    expect(() => JwtUserToken.initialize()).not.toThrow();

    const token = JwtUserToken.sign({ username: 'alice', role: 'manager', storeId: 'a'.repeat(24) });
    expect(typeof token).toBe('string');
    const payload = JwtUserToken.verify(token);
    expect(payload).toEqual({
      username: 'alice',
      role: 'manager',
      storeId: 'a'.repeat(24),
      iat: expect.any(Number),
      exp: expect.any(Number),
    });

    // Verify with jsonwebtoken directly using the same secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    expect((decoded as any).username).toBe('alice');
  });

  it('verify throws if token is invalid', async () => {
    process.env.JWT_SECRET = 'secret123';
    process.env.JWT_EXPIRES_IN = '3600';
    const JwtUserToken = await importJwtClass();
    expect(() => JwtUserToken.initialize()).not.toThrow();

    const token = 'invalid.token';
    expect(() => JwtUserToken.verify(token)).toThrow();
  });

  it('verify throws if token expired', async () => {
    process.env.JWT_SECRET = 'secret123';
    process.env.JWT_EXPIRES_IN = '1';
    const JwtUserToken = await importJwtClass();
    expect(() => JwtUserToken.initialize()).not.toThrow();

    const token = JwtUserToken.sign({ username: 'alice', role: 'manager', storeId: 'a'.repeat(24) });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(() => JwtUserToken.verify(token)).toThrow();
  });
});
