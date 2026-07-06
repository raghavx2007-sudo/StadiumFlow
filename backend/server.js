require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Server } = require('socket.io');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' }
});
server.io = io; // attach for tests

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

/** Valid severity values accepted by the incidents API */
const VALID_SEVERITIES = ['low', 'warning', 'critical'];

// ─── Security & Efficiency Middleware ────────────────────────────────────────
app.use(helmet());                // Secure HTTP headers
app.use(compression());           // Compress payloads for efficiency
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://stadium-flow-rose.vercel.app'
  ]
}));
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent payload attacks
app.use(mongoSanitize());         // Prevent NoSQL injection
app.use(xss());                   // Prevent Cross-Site Scripting
app.use(hpp());                   // Prevent HTTP Parameter Pollution

// ─── API Documentation (Swagger) ─────────────────────────────────────────────
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── WebSocket Real-time Connection ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Real-time operations dashboard connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ─── DDOS Protection Rate Limiting ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 100,                  // Max 100 requests per IP per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Input Validation Helpers ─────────────────────────────────────────────────

/**
 * Validates that required string fields are present and non-empty.
 * @param {object} body - Request body object
 * @param {string[]} fields - Field names to validate
 * @returns {string|null} Error message or null if valid
 */
function validateRequiredFields(body, fields) {
  for (const field of fields) {
    if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
      return `Missing or empty required field: ${field}`;
    }
  }
  return null;
}

/**
 * Validates that a severity value is one of the accepted enum values.
 * @param {string} severity - Severity value to check
 * @returns {boolean} True if valid
 */
function isValidSeverity(severity) {
  return VALID_SEVERITIES.includes(severity);
}

// ─── Authentication ───────────────────────────────────────────────────────────

/**
 * Authenticates a user and returns a signed JWT token.
 * @route POST /api/login
 * @body {string} username - The user's username
 * @body {string} password - The user's password
 * @returns {object} JWT token and success message
 */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Validate credentials against database
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '1h' }
    );

    res.json({ token, message: 'Authentication successful' });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// ─── Database Seeding ─────────────────────────────────────────────────────────

/**
 * Seeds the database with initial zone and incident data if empty.
 * Idempotent — only runs when no zones exist.
 * @async
 */
async function seedDatabase() {
  const zonesCount = await prisma.zone.count();
  if (zonesCount === 0) {
    await prisma.zone.createMany({
      data: [
        { name: 'North Stand',  capacity: 15000, current_occupancy: 14200, status: 'Warning'  },
        { name: 'South Stand',  capacity: 15000, current_occupancy: 12000, status: 'Normal'   },
        { name: 'VIP Box',      capacity: 500,   current_occupancy: 480,   status: 'Warning'  },
        { name: 'Food Court A', capacity: 2000,  current_occupancy: 1950,  status: 'Critical' },
      ],
    });

    const zone = await prisma.zone.findFirst();
    if (zone) {
      // Hash a default password for the seeded admin user
      const hashedPassword = await bcrypt.hash('StadiumAdmin2024!', 10);
      await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: { username: 'admin', password: hashedPassword, role: 'admin' },
      });

      await prisma.incident.createMany({
        data: [
          { zone_id: zone.id, description: 'Medical Emergency', severity: 'critical', reported_by: 'Staff-A' },
          { zone_id: zone.id, description: 'Spill on Walkway',  severity: 'warning',  reported_by: 'Staff-B' },
        ],
      });
    }
    console.log('Mock database seeded.');
  }
}
seedDatabase().catch(console.error);

// ─── Zone Routes ──────────────────────────────────────────────────────────────

/**
 * Retrieves all stadium zones with occupancy and status data.
 * @route GET /api/zones
 * @returns {Zone[]} Array of zone objects
 */
app.get('/api/zones', async (req, res) => {
  try {
    const zones = await prisma.zone.findMany();
    res.set('Cache-Control', 'public, max-age=300'); // 5-minute cache for efficiency
    res.json(zones);
  } catch (error) {
    console.error('ZONES ERROR:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

// ─── Incident Routes ──────────────────────────────────────────────────────────

/**
 * Retrieves all reported incidents, including associated zone details.
 * @route GET /api/incidents
 * @returns {Incident[]} Array of incident objects with zone relation
 */
app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      include: { zone: true },
      orderBy: { created_at: 'desc' },
    });
    res.set('Cache-Control', 'public, max-age=60'); // 1-minute cache
    res.json(incidents);
  } catch (error) {
    console.error('INCIDENTS ERROR:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

/**
 * Creates a new incident report.
 * Validates that description, severity, and reported_by are present and valid.
 * @route POST /api/incidents
 * @body {string} description   - Description of the incident (required)
 * @body {string} severity      - Severity level: low | warning | critical (required)
 * @body {string} reported_by   - Name or ID of the reporter (required)
 * @body {string} [zone_id]     - Optional zone ID to link the incident to a zone
 * @returns {Incident} The newly created incident object
 */
app.post('/api/incidents', async (req, res) => {
  try {
    const { zone_id, description, severity, reported_by } = req.body;

    // Validate required fields
    const fieldError = validateRequiredFields(req.body, ['description', 'severity', 'reported_by']);
    if (fieldError) {
      return res.status(400).json({ error: fieldError });
    }

    // Validate severity enum
    if (!isValidSeverity(severity)) {
      return res.status(400).json({
        error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`
      });
    }

    // Enforce description length
    if (description.trim().length > 500) {
      return res.status(400).json({ error: 'Description must not exceed 500 characters.' });
    }

    const newIncident = await prisma.incident.create({
      data: {
        zone_id: zone_id || undefined,
        description: description.trim(),
        severity,
        reported_by: reported_by.trim(),
      },
    });

    // Broadcast real-time update to connected dashboards
    io.emit('incident:new', newIncident);

    res.status(201).json(newIncident);
  } catch (error) {
    console.error('CREATE INCIDENT ERROR:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

/**
 * Resolves an open incident by updating its status to "resolved".
 * @route PUT /api/incidents/:id/resolve
 * @param {string} id - The incident ID to resolve
 * @returns {Incident} The updated incident object
 */
app.put('/api/incidents/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid incident ID.' });
    }

    const resolvedIncident = await prisma.incident.update({
      where: { id },
      data: { status: 'resolved' },
    });

    // Broadcast real-time update to connected dashboards
    io.emit('incident:resolved', resolvedIncident);

    res.json(resolvedIncident);
  } catch (error) {
    console.error('RESOLVE INCIDENT ERROR:', error);
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
});

// ─── Server Start ─────────────────────────────────────────────────────────────
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`API docs available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = server;
