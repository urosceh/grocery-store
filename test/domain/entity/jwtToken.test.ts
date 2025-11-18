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

  it('initialize warns if JWT_SECRET is empty', async () => {
    process.env.JWT_SECRET = '';
    delete process.env.JWT_EXPIRES_IN;
    const JwtUserToken = await importJwtClass();
    expect(() => JwtUserToken.initialize()).not.toThrow();
    // Branch exercised; console.error is mocked globally
  });

  it('uses default expiration when JWT_EXPIRES_IN is missing/invalid', async () => {
    process.env.JWT_SECRET = 'another_secret';
    delete process.env.JWT_EXPIRES_IN; // triggers default of 2h (7200s)
    const JwtUserToken = await importJwtClass();
    JwtUserToken.initialize();
    const token = JwtUserToken.sign({ username: 'bob', role: 'employee', storeId: 'b'.repeat(24) });
    const decoded: any = jwt.decode(token);
    expect(typeof decoded.iat).toBe('number');
    expect(typeof decoded.exp).toBe('number');
    const diff = decoded.exp - decoded.iat;
    // Allow small jitter
    expect(diff).toBeGreaterThanOrEqual(7199);
    expect(diff).toBeLessThanOrEqual(7201);
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
