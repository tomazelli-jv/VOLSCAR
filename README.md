# VW Fleet Manager

A complete fleet management system with Node.js backend and MySQL database.

## Features

- User authentication with JWT
- Car inventory management
- Event scheduling and calendar
- Dashboard with analytics
- Responsive frontend

## Setup

1. Install dependencies: `npm install`
2. Configure environment variables in `.env`
3. Initialize database: `npm run init-db`
4. Run the server: `npm start`

## Environment Variables

- `DB_HOST`: MySQL host
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: Database name
- `JWT_SECRET`: JWT secret key
- `PORT`: Server port (default 3000)

## Hostinger Deployment

- Veja o guia de implantação em `HOSTINGER_DEPLOY.md` para conectar o projeto ao MySQL do Hostinger.
- Use `.env.example` como modelo para configurar o seu `.env`.

## API Endpoints

- `POST /api/login` - User login
- `GET /api/cars` - Get all cars
- `POST /api/cars` - Add new car
- `GET /api/events` - Get all events
- `POST /api/events` - Add new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## Usage

Run the server with `npm start` and open `http://localhost:3000` in your browser. The frontend now uses the backend API on the same origin.

## Users

- `admin` / `admin123` (Administrator)
- `user1` / `user123` (User)
