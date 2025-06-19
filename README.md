# Fullstack React + Node.js + SQL Server Application

This is a fullstack application built with:
- Frontend: React (Vite) with SCSS
- Backend: Node.js with Express
- Database: SQL Server

## Setup

1. Configure your SQL Server connection by editing the `.env` file with your database credentials:
```env
PORT=5000
DB_SERVER=your_server_name
DB_DATABASE=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

2. Install dependencies:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

3. Start the application:

In one terminal, start the backend:
```bash
npm run dev
```

In another terminal, start the frontend:
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.
