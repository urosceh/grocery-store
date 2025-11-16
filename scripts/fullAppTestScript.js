/* eslint-disable no-console */
/**
 * Comprehensive API test runner for Grocery Store.
 * - Exercises auth, ACL, validation, pagination, and Mongo uniqueness.
 * - Reports pass/fail per scenario and endpoint coverage.
 *
 * Usage:
 *   API_BASE_URL=http://localhost:3000/api node scripts/fullAppTest.js
 *
 * Prerequisites:
 * - npm run seed:all - to seed the DB with store tree and users
 * - npm run start - to run the API
 *
 * Notes:
 * - Uses Node global fetch.
 */
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Seeded users (see scripts/data/users.json)
const USERS = {
  rootManager: { username: 'user.1.1', password: 'user11', storeId: '000000000000000000000001', role: 'manager' },
  employee: { username: 'user.4.1', password: 'user41', storeId: '000000000000000000000001', role: 'employee' },
  beogradManager: { username: 'user.1.14', password: 'user114', storeId: '00000000000000000000000e', role: 'manager' },
};

// Store IDs from scripts/data/storeTree.json
const STORES = {
  root: '000000000000000000000001', // Srbija (root)
  vojvodina: '000000000000000000000002',
  severnobacki: '000000000000000000000003',
  subotica: '000000000000000000000004',
  radnja1: '000000000000000000000005',
  juznobacki: '000000000000000000000006',
  noviSad: '000000000000000000000007',
  detelinara: '000000000000000000000008',
  radnja2: '000000000000000000000009',
  radnja3: '00000000000000000000000a',
  liman: '00000000000000000000000b',
  radnja4: '00000000000000000000000c',
  radnja5: '00000000000000000000000d',
  beograd: '00000000000000000000000e',
  noviBeograd: '00000000000000000000000f',
  bezanija: '000000000000000000000010',
  radnja6: '000000000000000000000011',
  vracar: '000000000000000000000012',
  neimar: '000000000000000000000013',
  radnja7: '000000000000000000000014',
  crveniKrst: '000000000000000000000015',
  radnja8: '000000000000000000000016',
  radnja9: '000000000000000000000017',
};

const EXPECTED_ENDPOINTS = new Set([
  'POST /user/login',
  'POST /user/logout',
  'POST /user',
  'GET /store/user-stores',
  'GET /store/:storeId/personnel',
]);
const coveredEndpoints = new Set();

function cover(key) {
  coveredEndpoints.add(key);
}

async function http(method, path, options = {}) {
  const { headers = {}, token, body, query } = options;
  const url = new URL(path.replace(/^\//, ''), BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`);
  if (query && typeof query === 'object') {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  if (token) reqHeaders.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  try {
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data, headers: res.headers, url: url.toString() };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectStatus(res, expected, label) {
  const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  expect(
    ok,
    `${label}: expected status ${expected}, got ${res.status}. URL: ${res.url} Body: ${safeStringify(res.data)}`,
  );
}

function safeStringify(x) {
  try {
    return typeof x === 'string' ? x : JSON.stringify(x);
  } catch {
    return String(x);
  }
}

async function login(username, password) {
  const res = await http('POST', '/user/login', { body: { username, password } });
  cover('POST /user/login');
  expectStatus(res, 200, 'Login should succeed');
  expect(typeof res.data === 'string' && res.data.length > 10, 'Login should return a JWT string');
  return res.data;
}

async function main() {
  console.log(`Running API tests against: ${BASE_URL}`);
  const results = [];

  async function record(name, fn) {
    const startedAt = Date.now();
    try {
      await fn();
      results.push({ name, ok: true, ms: Date.now() - startedAt });
      console.log(`✓ ${name}`);
    } catch (err) {
      results.push({ name, ok: false, error: err, ms: Date.now() - startedAt });
      console.error(`𐄂 ${name}\n   ${err.message}`);
    }
  }

  // Basic server reachability
  await record('Server reachable (/api/docs)', async () => {
    const res = await http('GET', '/docs');
    expectStatus(res, 200, 'Docs should be reachable');
  });

  // Auth negative cases
  await record('Login fails on invalid body (400)', async () => {
    const res = await http('POST', '/user/login', { body: { username: USERS.rootManager.username } });
    cover('POST /user/login');
    expectStatus(res, 400, 'Missing password should be 400');
  });

  await record('Login fails on wrong password (401)', async () => {
    const res = await http('POST', '/user/login', { body: { username: USERS.rootManager.username, password: 'nope' } });
    cover('POST /user/login');
    expectStatus(res, 401, 'Wrong password should be 401');
  });

  // Successful logins
  let rootToken = '';
  let employeeToken = '';
  let beogradManagerToken = '';
  await record('Login succeeds for root manager', async () => {
    rootToken = await login(USERS.rootManager.username, USERS.rootManager.password);
  });
  await record('Login succeeds for employee', async () => {
    employeeToken = await login(USERS.employee.username, USERS.employee.password);
  });
  await record('Login succeeds for Beograd manager', async () => {
    beogradManagerToken = await login(USERS.beogradManager.username, USERS.beogradManager.password);
  });

  // Token validation
  await record('Protected route without token yields 401', async () => {
    const res = await http('GET', '/store/user-stores');
    cover('GET /store/user-stores');
    expectStatus(res, 401, 'Missing token should be 401');
  });

  await record('Protected route with invalid token is rejected', async () => {
    const res = await http('GET', '/store/user-stores', { token: 'invalid.token.value' });
    cover('GET /store/user-stores');
    expectStatus(res, 401, `Invalid token should not be accepted, got ${res.status}`);
  });

  // /store/user-stores
  await record('Get user stores (manager) succeeds', async () => {
    const res = await http('GET', '/store/user-stores', { token: rootToken });
    cover('GET /store/user-stores');
    expectStatus(res, 200, 'User stores should be retrievable');
    expect(res.data && Array.isArray(res.data.stores), 'Response should contain { stores: [] }');
    expect(res.data.stores.length >= 1, 'Should list at least 1 store');
    const hasValidShape = res.data.stores.every(
      (s) => s && typeof s.displayName === 'string' && /^[0-9a-f]{24}$/i.test(s.id),
    );
    expect(hasValidShape, 'Each store should have id/displayName');
  });

  // /store/:storeId/personnel - baseline: missing token
  await record('Get personnel without token yields 401', async () => {
    const res = await http('GET', `/store/${STORES.radnja1}/personnel`);
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 401, 'Missing token should be 401');
  });

  await record(
    'Get personnel default params (manager) should return 200 with personnel from only passed store',
    async () => {
      const res = await http('GET', `/store/${STORES.radnja1}/personnel`, { token: rootToken });
      cover('GET /store/:storeId/personnel');
      expectStatus(res, 200, 'Get personnel default params (manager) should return 200');
      expect(res.data && Array.isArray(res.data.personnel), 'Response should contain { personnel: [] }');
      expect(
        res.data.personnel.every((u) => u.storeId === STORES.radnja1),
        'All personnel should be from radnja1 store',
      );
    },
  );

  await record('Get personnel with invalid limit => 400', async () => {
    const res = await http('GET', `/store/${STORES.radnja1}/personnel`, {
      token: rootToken,
      query: { limit: 'invalid' },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 400, 'Invalid limit should be 400');
  });

  await record('Get personnel (manager, type=all, includeChildNodes=false, paged)', async () => {
    const res = await http('GET', `/store/${STORES.noviBeograd}/personnel`, {
      token: beogradManagerToken,
      query: { type: 'all', includeChildNodes: 'false', limit: 5, offset: 0 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 200, 'Personnel should be retrievable');
    expect(res.data && Array.isArray(res.data.personnel), 'Response should contain { personnel: [] }');
  });

  await record('Get personnel (employee cannot request type=manager => 403)', async () => {
    const res = await http('GET', `/store/${STORES.radnja1}/personnel`, {
      token: employeeToken,
      query: { type: 'manager', limit: 5, offset: 0 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 403, 'Employee should not be authorized for manager personnel');
  });

  await record('Get personnel employee with all type should return only employees', async () => {
    const res = await http('GET', `/store/${STORES.radnja1}/personnel`, {
      token: employeeToken,
      query: { type: 'all', limit: 5, offset: 0 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 200, 'Employee should be authorized for all personnel');
    expect(res.data && Array.isArray(res.data.personnel), 'Response should contain { personnel: [] }');
    expect(
      res.data.personnel.every((u) => u.role === 'employee'),
      'All personnel should be employees',
    );
  });

  await record('Get personnel invalid storeId => 400', async () => {
    const res = await http('GET', `/store/${'xyz'}/personnel`, {
      token: rootToken,
      query: { limit: 5, offset: 0 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 400, 'Invalid storeId should be 400');
  });

  await record('Get non existing storeId => 400', async () => {
    const res = await http('GET', `/store/000000000000000000000022/personnel`, {
      token: rootToken,
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 400, 'Non existing storeId should be 400');
  });

  await record('Get personnel includeChildNodes increases result (manager)', async () => {
    const base = await http('GET', `/store/${STORES.beograd}/personnel`, {
      token: beogradManagerToken,
      query: { type: 'all', includeChildNodes: 'false', limit: 1000, offset: 0 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(base, 200, 'Base personnel should be retrievable');
    const withChildren = await http('GET', `/store/${STORES.beograd}/personnel`, {
      token: beogradManagerToken,
      query: { type: 'all', includeChildNodes: 'true', limit: 1000, offset: 0 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(withChildren, 200, 'Personnel with children should be retrievable');
    const lenBase = Array.isArray(base.data?.personnel) ? base.data.personnel.length : -1;
    const lenChildren = Array.isArray(withChildren.data?.personnel) ? withChildren.data.personnel.length : -1;
    expect(lenBase >= 0 && lenChildren >= 0, 'Personnel arrays should be present');
    expect(lenChildren >= lenBase, 'Including child nodes should not reduce result size');
  });

  await record('Get personnel for root manager should return 200 with personnel from all stores', async () => {
    const res = await http('GET', `/store/${STORES.root}/personnel`, {
      token: rootToken,
      query: { type: 'all', includeChildNodes: 'true', limit: 1000, offset: 0 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 200, 'Personnel should be retrievable');
    expect(res.data && Array.isArray(res.data.personnel), 'Response should contain { personnel: [] }');
    expect(res.data.personnel.length >= 1, 'Should list at least 1 person');
    const storesSeen = new Set();
    for (const p of res.data.personnel) {
      storesSeen.add(p.storeId);
    }
    for (const storeId of Object.values(STORES)) {
      expect(storesSeen.has(storeId), `Store ${storeId} should be in the response`);
    }
  });

  await record('Get personnel pagination works (no overlap between pages)', async () => {
    const q = { type: 'employee', includeChildNodes: 'true', limit: 2, offset: 0 };
    const page1 = await http('GET', `/store/${STORES.root}/personnel`, { token: rootToken, query: q });
    cover('GET /store/:storeId/personnel');
    expectStatus(page1, 200, 'Page 1 should be 200');
    const page2 = await http('GET', `/store/${STORES.root}/personnel`, {
      token: rootToken,
      query: { ...q, offset: 2 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(page2, 200, 'Page 2 should be 200');
    const set1 = new Set((page1.data?.personnel || []).map((u) => u.username));
    const set2 = new Set((page2.data?.personnel || []).map((u) => u.username));
    const intersection = [...set1].filter((x) => set2.has(x));
    expect(intersection.length === 0, 'Pages should not overlap for same limit/offset windows');
  });

  await record('Get personnel forbidden across subtrees (403)', async () => {
    // Beograd manager should not access Subotica subtree target directly
    const res = await http('GET', `/store/${STORES.radnja1}/personnel`, {
      token: beogradManagerToken,
      query: { limit: 5, offset: 0 },
    });
    cover('GET /store/:storeId/personnel');
    expectStatus(res, 403, 'Cross-subtree access should be forbidden');
  });

  // /user create
  await record('Create user without token => 401', async () => {
    const res = await http('POST', '/user', {
      body: {
        username: 'no_access_user',
        name: 'X',
        password: 'x',
        role: 'employee',
        storeId: STORES.radnja1,
      },
    });
    cover('POST /user');
    expectStatus(res, 401, 'Missing token should be 401');
  });

  await record('Create user invalid body => 400', async () => {
    const res = await http('POST', '/user', {
      token: rootToken,
      body: { username: 'abc' }, // missing required fields
    });
    cover('POST /user');
    expectStatus(res, 400, 'Invalid body should be 400');
  });

  await record('Create user forbidden across subtree => 403', async () => {
    const res = await http('POST', '/user', {
      token: beogradManagerToken,
      body: {
        username: 'no_access_user',
        name: 'NoAccess',
        password: 'x',
        role: 'employee',
        storeId: STORES.radnja1, // outside Beograd subtree
      },
    });
    cover('POST /user');
    expectStatus(res, 403, 'Forbidden store should be 403');
  });

  const newUsername = 'new_user_success';
  await record('Create user succeeds (manager)', async () => {
    const res = await http('POST', '/user', {
      token: rootToken,
      body: {
        username: newUsername,
        name: 'E2E New',
        password: 'Secret123!',
        role: 'employee',
        storeId: STORES.radnja3,
      },
    });
    cover('POST /user');
    expectStatus(res, 200, 'User creation should succeed');
  });

  await record('Created user can login', async () => {
    const token = await login(newUsername, 'Secret123!');
    expect(typeof token === 'string' && token.length > 10, 'New user token should be a non-empty string');
  });

  await record('Unique username enforced (duplicate => 4xx/5xx)', async () => {
    const res = await http('POST', '/user', {
      token: rootToken,
      body: {
        username: newUsername, // duplicate
        name: 'Dup',
        password: 'x',
        role: 'employee',
        storeId: STORES.radnja3,
      },
    });
    cover('POST /user');
    expect(res.status === 400, `Duplicate username should fail, got ${res.status}`);
  });

  // logout
  await record('Logout returns 204', async () => {
    const res = await http('POST', '/user/logout', { token: rootToken });
    cover('POST /user/logout');
    expectStatus(res, 204, 'Logout should be 204');
  });

  // Summary
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log('\n==== Summary ====');
  console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`- ${r.name}: ${r.error?.message}`);
    }
  }
  const uncovered = [...EXPECTED_ENDPOINTS].filter((e) => !coveredEndpoints.has(e));
  if (uncovered.length > 0) {
    console.log('\nUncovered endpoints:');
    for (const e of uncovered) console.log(`- ${e}`);
  } else {
    console.log('\nAll expected endpoints were exercised.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
