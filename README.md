# Cricket League Management Web App

A production-ready Cricket League Management System with complete CRUD operations, round-robin fixtures, match results, NRR calculation, and playoff qualification.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL
- **ORM**: Prisma
- **Real-time**: Socket.io (optional)

## Features

### Authentication

- JWT-based authentication
- Roles: Admin, Viewer

### Team Management

- CRUD operations for teams
- Each team has: id, name, logo

### Player Management

- Add players to teams
- Fields: id, name, teamId

### Fixture Management

- 6 teams, round-robin format (15 matches)
- Auto-generate fixtures
- Store match date, time, venue

### Match Module

- Enter match results (team1_score, team1_overs, team2_score, team2_overs)
- Automatic winner decision
- Handle edge cases: tie, abandoned match

### Points Table

- Matches, wins, losses, points
- Runs scored, overs faced
- Runs conceded, overs bowled
- NRR (Net Run Rate)

### NRR Calculation

- Formula: NRR = (runs_scored / overs_faced) - (runs_conceded / overs_bowled)
- Auto-update after every match

### Qualification Logic

- Highlight teams with ≥ 3 wins
- Top 4 teams qualify for semi-finals

### Playoff Module

- Semi Final 1: Rank 1 vs Rank 4
- Semi Final 2: Rank 2 vs Rank 3
- Final match

### Frontend UI

- Dashboard with stats
- Teams Page with player counts
- Fixtures Page with filters
- Points Table with sorting by NRR
- Admin Panel for management
- Color coding: Green = Qualified, Red = Eliminated

### Export

- Export points table to CSV/Excel

## Project Structure

```
cricket-league-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── teams.js
│   │   │   ├── players.js
│   │   │   ├── matches.js
│   │   │   ├── points.js
│   │   │   └── playoffs.js
│   │   ├── utils/
│   │   │   └── nrr.js
│   │   └── index.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── Fixtures.jsx
│   │   │   ├── PointsTable.jsx
│   │   │   ├── Admin.jsx
│   │   │   └── Login.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── tailwind.config.js
│   └── package.json
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- MySQL (v8.0+)

### 1. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE cricket_db;
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables

**Backend** (`backend/.env`):

```env
DATABASE_URL="mysql://root:password@localhost:3306/cricket_db"
JWT_SECRET="your_secret_key"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Setup Database

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 5. Seed Database

```bash
node prisma/seed.js
```

This will create:

- Admin user: admin@cricket.com / admin123
- Viewer user: viewer@cricket.com / viewer123
- 6 Teams with players
- 15 Round-robin fixtures

### 6. Run the Application

**Development Mode** (both frontend and backend):

```bash
npm run dev
```

**Separate Terminals**:

```bash
# Backend
cd backend
npm run dev:server

# Frontend
cd frontend
npm run dev
```

### 7. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## API Endpoints

### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Teams

- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get single team
- `POST /api/teams` - Create team (admin)
- `PUT /api/teams/:id` - Update team (admin)
- `DELETE /api/teams/:id` - Delete team (admin)

### Players

- `GET /api/players` - Get all players
- `POST /api/players` - Create player (admin)
- `PUT /api/players/:id` - Update player (admin)
- `DELETE /api/players/:id` - Delete player (admin)

### Matches

- `GET /api/matches` - Get all matches
- `POST /api/matches/generate-fixtures` - Generate fixtures (admin)
- `PUT /api/matches/:id/result` - Update match result (admin)

### Points

- `GET /api/points` - Get points table

### Playoffs

- `GET /api/playoffs` - Get playoffs
- `POST /api/playoffs/generate` - Generate playoffs (admin)
- `PUT /api/playoffs/:id/result` - Update playoff result (admin)

## Demo Credentials

- **Admin**: admin@cricket.com / admin123
- **Viewer**: viewer@cricket.com / viewer123

## License

ISC
