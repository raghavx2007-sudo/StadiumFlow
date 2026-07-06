# StadiumFlow - MatchDay Operations Dashboard

StadiumFlow is a centralized, real-time dashboard built for Smart Stadiums and Tournament Operations. It allows stadium operations staff to monitor zone capacities, track active matches, and manage operational incidents seamlessly.

Built for high performance and rapid iteration during hackathons, this project strictly adheres to robust code quality, security, and accessibility standards.

## 🚀 Architecture Overview

The application is decoupled into a clear Frontend and Backend architecture:

*   **Frontend (Next.js & React):** A modern, dark-themed, responsive Single Page Application (SPA) utilizing CSS Modules. Built to be deployed on Edge networks like Vercel.
*   **Backend (Node.js & Express):** A fast, lightweight API server handling data routing. Built to be deployed on platforms like Render or Heroku.
*   **Database (MongoDB via Prisma ORM):** A secure, strictly-typed database layer preventing injection attacks, backed by a scalable NoSQL cloud cluster.

## 📁 Folder Structure

```
StadiumFlow/
├── backend/                  # Express API Server & Database
│   ├── prisma/
│   │   └── schema.prisma     # MongoDB Schema definition
│   ├── server.js             # Main Express application & API routes
│   └── package.json          
├── frontend/                 # Next.js Application
│   ├── app/
│   │   ├── components/       # Reusable UI components (Sidebar)
│   │   ├── incidents/        # Incident Tracker page
│   │   ├── zones/            # Zone Management page
│   │   ├── globals.css       # Global design system & variables
│   │   ├── layout.tsx        # Root layout wrapping
│   │   └── page.tsx          # Dashboard Overview page
│   ├── next.config.mjs
│   └── package.json
└── README.md
```

## ✨ Features

*   **Real-time Dashboard:** View high-level metrics like total attendance, live active match status, and critical incident counts.
*   **Zone Capacity Management:** Visually track the occupancy of different stadium zones (e.g., VIP, Food Court) with dynamic progress bars warning of overcrowding.
*   **Incident Ticketing System:** Staff can securely report and immediately resolve emergencies, spills, or maintenance issues across the venue.
*   **Responsive & Accessible:** Fully keyboard-navigable UI with high-contrast dark mode aesthetics.

## 🛠️ Installation & Local Development

To run this project locally, you will need two separate terminal windows.

### 1. Setup Backend
```bash
cd backend
npm install
```
**Configure Environment Variable:**
Create a `.env` file inside the `backend` folder and add your MongoDB Atlas connection string:
```env
DATABASE_URL="mongodb+srv://<user>:<password>@cluster0.mongodb.net/matchday_db?retryWrites=true&w=majority"
```
**Push Schema & Run:**
```bash
npx prisma generate
npx prisma db push
npm run dev
```
*(The backend will start on http://localhost:5000 and automatically seed initial data!)*

### 2. Setup Frontend
Open a second terminal window.
```bash
cd frontend
npm install
```
*(Optional)* If you are deploying or running the backend on a different port, create a `.env.local` inside `frontend/` and add:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```
**Run:**
```bash
npm run dev
```
*(The frontend will start on http://localhost:3000)*

## 📚 API Documentation

The Express backend exposes the following REST API endpoints at `http://localhost:5000`:

### `GET /api/zones`
Fetches all stadium zones and their current capacities.
*   **Response:** `Array<{ id, name, capacity, current_occupancy, status }>`

### `GET /api/incidents`
Fetches all reported incidents, joined with their respective zone data.
*   **Response:** `Array<{ id, description, severity, status, reported_by, zone }>`

### `POST /api/incidents`
Creates a new incident report.
*   **Payload:** `{ zone_id: string, description: string, severity: string, reported_by: string }}`

### `PUT /api/incidents/:id/resolve`
Marks an active incident as resolved.
*   **Response:** `{ id, status: "resolved", ... }`

## 🔒 Security Practices
*   **Prisma ORM:** Completely eliminates NoSQL/SQL injection vulnerabilities.
*   **React DOM:** Native XSS escaping prevents malicious script execution in Incident descriptions.
*   **CORS:** Backend configured to restrict external domain fetching.
