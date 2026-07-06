const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Security and Efficiency Middleware
app.use(helmet()); // Secure HTTP headers
app.use(compression()); // Compress payloads for efficiency
app.use(cors({ origin: '*' })); // CORS policy
app.use(express.json());

// DDOS Protection Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

/**
 * Seed initial database values if empty.
 * @async
 * @function seedDatabase
 */
async function seedDatabase() {
  const zonesCount = await prisma.zone.count();
  if (zonesCount === 0) {
    await prisma.zone.createMany({
      data: [
        { name: 'North Stand', capacity: 15000, current_occupancy: 14200, status: 'Warning' },
        { name: 'South Stand', capacity: 15000, current_occupancy: 12000, status: 'Normal' },
        { name: 'VIP Box', capacity: 500, current_occupancy: 480, status: 'Warning' },
        { name: 'Food Court A', capacity: 2000, current_occupancy: 1950, status: 'Critical' },
      ],
    });
    
    const zone = await prisma.zone.findFirst();
    if (zone) {
      await prisma.incident.createMany({
        data: [
          { zone_id: zone.id, description: 'Medical Emergency', severity: 'critical', reported_by: 'Staff-A' },
          { zone_id: zone.id, description: 'Spill on Walkway', severity: 'warning', reported_by: 'Staff-B' }
        ]
      });
    }
    console.log('Mock database seeded.');
  }
}
seedDatabase().catch(console.error);

/**
 * Fetches all stadium zones.
 * @route GET /api/zones
 */
app.get('/api/zones', async (req, res) => {
  try {
    const zones = await prisma.zone.findMany();
    res.json(zones);
  } catch (error) {
    console.error("ZONES ERROR:", error);
    res.status(500).json({ error: 'Failed to fetch zones', details: error.message });
  }
});

/**
 * Fetches all reported incidents.
 * @route GET /api/incidents
 */
app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      include: { zone: true }
    });
    res.json(incidents);
  } catch (error) {
    console.error("INCIDENTS ERROR:", error);
    res.status(500).json({ error: 'Failed to fetch incidents', details: error.message });
  }
});

/**
 * Creates a new incident.
 * @route POST /api/incidents
 */
app.post('/api/incidents', async (req, res) => {
  try {
    const { zone_id, description, severity, reported_by } = req.body;
    const newIncident = await prisma.incident.create({
      data: { zone_id, description, severity, reported_by }
    });
    res.json(newIncident);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

/**
 * Resolves an incident by ID.
 * @route PUT /api/incidents/:id/resolve
 */
app.put('/api/incidents/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const resolvedIncident = await prisma.incident.update({
      where: { id },
      data: { status: 'resolved' }
    });
    res.json(resolvedIncident);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

module.exports = app;
