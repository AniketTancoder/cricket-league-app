# Cricket League Backend - Railway Deployment Guide

## Prerequisites

- Railway account
- Railway CLI installed
- Node.js and npm installed

## Deployment Steps

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

### 3. Create a new Railway project

```bash
railway init
```

### 4. Add environment variables

```bash
railway variables set RAILWAY_DATABASE_URL "mysql://root:Aniket@1928@localhost:3306/cricket_db"
railway variables set RAILWAY_JWT_SECRET "cricket_league_secret_key_2026"
railway variables set RAILWAY_PORT 5000
railway variables set RAILWAY_FRONTEND_URL "https://your-frontend-url.netlify.app"
```

### 5. Deploy to Railway

```bash
railway deploy
```

### 6. Get your Railway URL

After deployment, you'll get a URL like `https://your-project-name.up.railway.app`

## Environment Variables

| Variable             | Description                | Example                                              |
| -------------------- | -------------------------- | ---------------------------------------------------- |
| RAILWAY_DATABASE_URL | Database connection string | `mysql://root:Aniket@1928@localhost:3306/cricket_db` |
| RAILWAY_JWT_SECRET   | JWT secret key             | `cricket_league_secret_key_2026`                     |
| RAILWAY_PORT         | Server port                | `5000`                                               |
| RAILWAY_FRONTEND_URL | Frontend URL for CORS      | `https://your-frontend-url.netlify.app`              |

## API Endpoints

After deployment, your API will be available at:

- Base URL: `https://your-project-name.up.railway.app`
- Health check: `https://your-project-name.up.railway.app/api/health`

## Database

Railway will automatically create a MySQL database for you. You can access it through the Railway dashboard.
