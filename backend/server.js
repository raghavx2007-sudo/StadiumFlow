const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to seed initial data if DB is empty (mocking for hackathon MVP)
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

// Routes
app.get('/api/zones', async (req, res) => {
  try {
    const zones = await prisma.zone.findMany();
    res.json(zones);
  } catch (error) {
    console.error("ZONES ERROR:", error);
    res.status(500).json({ error: 'Failed to fetch zones', details: error.message });
  }
});

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
