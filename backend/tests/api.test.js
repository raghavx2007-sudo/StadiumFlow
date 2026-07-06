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
});
