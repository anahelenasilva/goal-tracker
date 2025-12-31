# Goal Tracker 2026

A simple and modern web application to track my daily goals for 2026. Built with NestJS backend, React + Vite frontend, PostgreSQL database, and styled with Tailwind CSS.

## Features

- 📊 Track two default goals: Exercise and Treadmill
- ✅ Add one entry per day per goal
- 🚫 Duplicate prevention (both UI and backend)
- 📈 View total entry count for each goal
- 📅 See list of all entries with dates
- 🎨 Modern, responsive UI with Tailwind CSS
- 🧪 Comprehensive unit tests with jest-mock-extended

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for database operations
- **PostgreSQL** - Database
- **Jest + jest-mock-extended** - Testing framework

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- pnpm (for backend and frontend)
- Docker and Docker Compose (for PostgreSQL database)

## Installation

### 1. Clone the Repository

```bash
cd goal-tracker
```

### 2. Setup PostgreSQL Database with Docker

Start the PostgreSQL database using Docker Compose:

```bash
cd backend
docker-compose up -d
```

This will:
- Start PostgreSQL 16 in a Docker container
- Expose the database on port **5434** (not the default 5432)
- Create a volume for data persistence
- Automatically create the `goal_tracker` database

To stop the database:

```bash
docker-compose down
```

To stop and remove all data:

```bash
docker-compose down -v
```

### 3. Setup Backend

```bash
cd backend
pnpm install

# Copy environment file (already configured for Docker)
cp .env.example .env

# The .env is pre-configured for Docker:
# DATABASE_HOST=localhost
# DATABASE_PORT=5434  (Docker mapped port)
# DATABASE_USER=postgres
# DATABASE_PASSWORD=postgres
# DATABASE_NAME=goal_tracker
# PORT=3000
```

### 4. Setup Frontend

```bash
cd ../frontend
pnpm install

# Note: @tailwindcss/postcss is already included in dependencies
```

## Running the Application

### Start PostgreSQL (Docker)

First, make sure the PostgreSQL container is running:

```bash
cd backend
docker-compose up -d
```

Check if the database is ready:

```bash
docker-compose ps
```

### Start Backend

```bash
cd backend
pnpm run start:dev
```

The backend will:
- Connect to PostgreSQL on port **5434**
- Start on `http://localhost:3000`
- Automatically create database tables
- Seed the database with an admin user and two default goals (exercise, treadmill)

### Start Frontend

In a new terminal:

```bash
cd frontend
pnpm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

1. Open your browser to `http://localhost:5173`
2. You'll see the Dashboard with two goal columns: Exercise and Treadmill
3. Click "Add Entry" button to add an entry for today
4. The button will be disabled if you've already added an entry for today
5. View your entry count and list of all entries below each goal

## API Endpoints

### Goals

- `GET /goals` - Get all goals
- `GET /goals/:id` - Get a specific goal
- `GET /goals/:id/entries` - Get all entries for a goal (includes count and hasEntryToday flag)
- `POST /goals/:id/entries` - Create an entry for today

## Database Schema

### Tables

1. **users**
   - `id` (UUID, primary key)
   - `name` (string)
   - `email` (string)
   - `created_at` (timestamp)

2. **goals**
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key)
   - `title` (string)
   - `created_at` (timestamp)

3. **goal_entries**
   - `id` (UUID, primary key)
   - `goal_id` (UUID, foreign key)
   - `created_at` (timestamp)
   - Unique constraint on `(goal_id, DATE(created_at))`

## Running Tests

### Backend Unit Tests

```bash
cd backend
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov
```

## Project Structure

```
goal-tracker/
├── backend/
│   ├── src/
│   │   ├── entities/          # Database entities
│   │   ├── modules/
│   │   │   └── goals/         # Goals module with service, controller, and tests
│   │   ├── database/          # Database seeding
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── docker-compose.yml     # PostgreSQL Docker setup
│   ├── .dockerignore
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/             # Dashboard page
│   │   ├── services/          # API client
│   │   ├── components/        # React components
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Docker Setup

The project uses Docker Compose to run PostgreSQL, making it easy to set up and manage the database without installing PostgreSQL locally.

### Docker Configuration

**docker-compose.yml** includes:
- PostgreSQL 16 Alpine (lightweight image)
- Port mapping: 5434 (host) → 5432 (container)
- Named volume for data persistence
- Health check to ensure database is ready
- Environment variables from `.env` file

### Docker Commands

You can use either Docker Compose commands or the convenient pnpm scripts:

**Using pnpm scripts (recommended):**
```bash
cd backend

# Start database
pnpm run docker:up

# View logs
pnpm run docker:logs

# Stop database
pnpm run docker:down

# Stop and remove data
pnpm run docker:clean

# Restart database
pnpm run docker:restart
```

**Using Docker Compose directly:**
```bash
cd backend

# Start database
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v

# Restart database
docker-compose restart

# Check status
docker-compose ps

# Access PostgreSQL CLI
docker exec -it goal-tracker-postgres psql -U postgres -d goal_tracker
```

## Key Features Implementation

### Duplicate Prevention

The application prevents adding multiple entries per day through:

1. **Database Level**: Unique index on `(goal_id, DATE(created_at))`
2. **Backend**: Validation in service layer with ConflictException
3. **Frontend**: Button disabled when entry exists for today + error message display

### Auto-Seeding

The database is automatically seeded on application startup with:
- Default admin user (admin@example.com)
- Two goals: "exercise" and "treadmill"

This happens via the `SeedService` which implements `OnModuleInit`.

## Development

### Backend Development

```bash
cd backend
pnpm run start:dev  # Hot reload enabled
```

### Frontend Development

```bash
cd frontend
pnpm run dev  # Hot reload enabled
```

## Production Build

### Backend

```bash
cd backend
pnpm run build
pnpm run start:prod
```

### Frontend

```bash
cd frontend
pnpm run build
# Serve the dist/ folder with your preferred static server
```

## Environment Variables

### Backend (.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=5434  # Docker mapped port
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=goal_tracker
PORT=3000
```

## Troubleshooting

### Database Connection Issues

**Docker Database:**
- Ensure Docker is running: `docker ps`
- Check if PostgreSQL container is running: `docker-compose ps`
- View database logs: `docker-compose logs postgres`
- Restart database: `docker-compose restart`

**Connection:**
- Verify port 5434 is not in use: `lsof -i :5434`
- Test connection: `docker exec -it goal-tracker-postgres psql -U postgres -d goal_tracker`
- Verify credentials in `.env` file match `docker-compose.yml`

### Port Already in Use

- Backend: Change `PORT` in backend `.env`
- Frontend: Vite will automatically try the next available port

### CORS Issues

- Backend CORS is configured for `http://localhost:5173`
- Update `main.ts` if frontend runs on a different port

## License

This project is for personal use.

## Author

Built with ❤️ for tracking 2026 goals!

