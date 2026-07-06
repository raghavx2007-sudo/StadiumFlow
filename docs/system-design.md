# System Design: Smart Stadiums & Tournament Operations

## Real-Time Architecture
The system uses Socket.io to establish a full-duplex communication channel for real-time crowd control and incident management.

## Scalability
Dockerized containers orchestrated via docker-compose ensure horizontal scaling during high-traffic tournament matches.

## Security
NoSQL injection is prevented via Prisma ORM and express-mongo-sanitize. JWT and bcrypt handle secure operator authentication.
