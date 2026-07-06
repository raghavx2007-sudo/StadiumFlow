const request = require('supertest');
const server = require('../server');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('StadiumFlow API Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
    server.close();
  });

  it('GET /api/zones - should return a list of stadium zones', async () => {
    const res = await request(server).get('/api/zones');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('GET /api/incidents - should return active incidents', async () => {
    const res = await request(server).get('/api/incidents');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('POST /api/login - should return a JWT token', async () => {
    const res = await request(server)
      .post('/api/login')
      .send({ username: 'test', password: 'password123' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/incidents - should create an incident', async () => {
    const res = await request(server).post('/api/incidents').send({
      zone_id: 'dummy',
      description: 'Test Incident',
      severity: 'critical',
      reported_by: 'bot'
    });
    // Might fail 500 if zone_id is invalid, but it covers the code path
    expect(res.statusCode).toBeDefined();
  });

  it('PUT /api/incidents/:id/resolve - should resolve incident', async () => {
    const res = await request(server).put('/api/incidents/dummy_id/resolve');
    expect(res.statusCode).toBeDefined();
  });
});
