// Provide defaults for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || String(2 * 60 * 60);
