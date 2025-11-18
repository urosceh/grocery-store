// Silence all console output during tests to keep output clean
const noop = () => {};

// Prefer spies so tests can assert on calls if needed (and restore safely)
const spies: Array<jest.SpyInstance<any, any>> = [];

beforeAll(() => {
  spies.push(jest.spyOn(console, 'log').mockImplementation(noop));
  spies.push(jest.spyOn(console, 'info').mockImplementation(noop));
  spies.push(jest.spyOn(console, 'warn').mockImplementation(noop));
  spies.push(jest.spyOn(console, 'error').mockImplementation(noop));
  spies.push(jest.spyOn(console, 'debug').mockImplementation(noop));
});

afterAll(() => {
  for (const s of spies) {
    s.mockRestore();
  }
});


