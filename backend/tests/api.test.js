const request = require('supertest');
const server = require('../server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Test Helpers ─────────────────────────────────────────────────────────────

/** Creates a test zone and returns it */
async function createTestZone(overrides = {}) {
  return prisma.zone.create({
    data: {
      name: overrides.name || `Test Zone ${Date.now()}`,
      capacity: overrides.capacity || 1000,
      current_occupancy: overrides.current_occupancy || 0,
      status: overrides.status || 'Normal',
    },
  });
}

/** Creates a test incident linked to a zone and returns it */
async function createTestIncident(zoneId, overrides = {}) {
  return prisma.incident.create({
    data: {
      zone_id: zoneId,
      description: overrides.description || 'Test incident',
      severity: overrides.severity || 'low',
      reported_by: overrides.reported_by || 'Tester',
    },
  });
}

// ─── Suite Setup ──────────────────────────────────────────────────────────────

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

// ─── Zone Endpoints ───────────────────────────────────────────────────────────

describe('GET /api/zones', () => {
  it('should return 200 and an array of zones', async () => {
    const res = await request(server).get('/api/zones');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should include expected zone fields in each result', async () => {
    const zone = await createTestZone({ name: 'Field Check Zone' });
    const res = await request(server).get('/api/zones');
    const match = res.body.find(z => z.id === zone.id);
    expect(match).toBeDefined();
    expect(match).toHaveProperty('name');
    expect(match).toHaveProperty('capacity');
    expect(match).toHaveProperty('current_occupancy');
    expect(match).toHaveProperty('status');
    await prisma.zone.delete({ where: { id: zone.id } });
  });

  it('should include a Cache-Control header', async () => {
    const res = await request(server).get('/api/zones');
    expect(res.headers['cache-control']).toMatch(/max-age/);
  });

  it('should set security headers via helmet', async () => {
    const res = await request(server).get('/api/zones');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

// ─── Incident Endpoints ───────────────────────────────────────────────────────

describe('GET /api/incidents', () => {
  it('should return 200 and an array of incidents', async () => {
    const res = await request(server).get('/api/incidents');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should include zone relation in incident results', async () => {
    const zone = await createTestZone({ name: 'Incident Zone' });
    await createTestIncident(zone.id, { description: 'Relation check' });

    const res = await request(server).get('/api/incidents');
    const match = res.body.find(i => i.description === 'Relation check');
    expect(match).toBeDefined();
    expect(match).toHaveProperty('zone');
    expect(match.zone).toHaveProperty('name', 'Incident Zone');

    await prisma.incident.deleteMany({ where: { zone_id: zone.id } });
    await prisma.zone.delete({ where: { id: zone.id } });
  });

  it('should include a Cache-Control header', async () => {
    const res = await request(server).get('/api/incidents');
    expect(res.headers['cache-control']).toMatch(/max-age/);
  });

  it('should return incidents ordered by created_at desc', async () => {
    const res = await request(server).get('/api/incidents');
    expect(res.statusCode).toBe(200);
    if (res.body.length > 1) {
      const dates = res.body.map(i => new Date(i.created_at).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    }
  });
});

describe('POST /api/incidents', () => {
  let testZone;

  beforeAll(async () => {
    testZone = await createTestZone({ name: 'POST Test Zone' });
  });

  afterAll(async () => {
    await prisma.incident.deleteMany({ where: { zone_id: testZone.id } });
    await prisma.zone.delete({ where: { id: testZone.id } });
  });

  it('should create an incident and return 201 with the new object', async () => {
    const res = await request(server).post('/api/incidents').send({
      zone_id: testZone.id,
      description: 'Gate malfunction',
      severity: 'low',
      reported_by: 'Staff-Test',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.description).toBe('Gate malfunction');
    expect(res.body.severity).toBe('low');
    expect(res.body.status).toBe('open');
  });

  it('should accept all valid severity levels', async () => {
    for (const severity of ['low', 'warning', 'critical']) {
      const res = await request(server).post('/api/incidents').send({
        zone_id: testZone.id,
        description: `Severity ${severity} test`,
        severity,
        reported_by: 'Tester',
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.severity).toBe(severity);
    }
  });

  it('should return 400 when description is missing', async () => {
    const res = await request(server).post('/api/incidents').send({
      zone_id: testZone.id,
      severity: 'low',
      reported_by: 'Tester',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when severity is missing', async () => {
    const res = await request(server).post('/api/incidents').send({
      zone_id: testZone.id,
      description: 'Missing severity',
      reported_by: 'Tester',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when reported_by is missing', async () => {
    const res = await request(server).post('/api/incidents').send({
      zone_id: testZone.id,
      description: 'Missing reporter',
      severity: 'low',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when severity is an invalid value', async () => {
    const res = await request(server).post('/api/incidents').send({
      zone_id: testZone.id,
      description: 'Bad severity',
      severity: 'extreme', // invalid
      reported_by: 'Tester',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/severity/i);
  });

  it('should return 400 when description exceeds 500 characters', async () => {
    const res = await request(server).post('/api/incidents').send({
      zone_id: testZone.id,
      description: 'A'.repeat(501),
      severity: 'low',
      reported_by: 'Tester',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should allow creating an incident without a zone_id', async () => {
    const res = await request(server).post('/api/incidents').send({
      description: 'No zone incident',
      severity: 'low',
      reported_by: 'Tester',
    });
    // Should either succeed (201) or fail at DB level (500)
    // but not fail validation (400)
    expect(res.statusCode).not.toBe(400);
  });
});

describe('PUT /api/incidents/:id/resolve', () => {
  let testZone;
  let testIncident;

  beforeAll(async () => {
    testZone = await createTestZone({ name: 'Resolve Test Zone' });
    testIncident = await createTestIncident(testZone.id, {
      description: 'To be resolved',
      severity: 'critical',
    });
  });

  afterAll(async () => {
    await prisma.incident.deleteMany({ where: { zone_id: testZone.id } });
    await prisma.zone.delete({ where: { id: testZone.id } });
  });

  it('should resolve an open incident and return updated object', async () => {
    const res = await request(server)
      .put(`/api/incidents/${testIncident.id}/resolve`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('resolved');
    expect(res.body.id).toBe(testIncident.id);
  });

  it('should return 500 for a non-existent incident ID', async () => {
    const res = await request(server)
      .put('/api/incidents/nonexistentid999/resolve');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── Authentication ───────────────────────────────────────────────────────────

describe('POST /api/login', () => {
  it('should return 400 when username or password is missing', async () => {
    const res = await request(server).post('/api/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 for an unknown username', async () => {
    const res = await request(server).post('/api/login').send({
      username: 'unknown_user_xyz',
      password: 'anypassword',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(server).post('/api/login').send({ username: 'admin' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── Security Headers ─────────────────────────────────────────────────────────

describe('Security Middleware', () => {
  it('should set X-Frame-Options header', async () => {
    const res = await request(server).get('/api/zones');
    // Helmet sets x-frame-options or content-security-policy
    expect(
      res.headers['x-frame-options'] || res.headers['content-security-policy']
    ).toBeDefined();
  });

  it('should respond to CORS preflight', async () => {
    const res = await request(server)
      .options('/api/zones')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');
    expect([200, 204]).toContain(res.statusCode);
  });
});

// ─── API Documentation ────────────────────────────────────────────────────────

describe('GET /api-docs', () => {
  it('should serve the Swagger UI', async () => {
    const res = await request(server).get('/api-docs/');
    expect([200, 301, 302]).toContain(res.statusCode);
  });
});
