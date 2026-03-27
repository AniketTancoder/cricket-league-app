# Cricket League Frontend - Netlify Deployment Guide

## Prerequisites

- Netlify account
- Netlify CLI installed
- Node.js and npm installed

## Deployment Steps

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Login to Netlify

```bash
netlify login
```

### 3. Create a new Netlify site

```bash
netlify init
```

### 4. Add environment variables

```bash
netlify env:set VITE_API_URL "https://your-backend-url.up.railway.app/api"
netlify env:set VITE_IS_RAILWAY true
netlify env:set VITE_RAILWAY_API_URL "https://your-backend-url.up.railway.app/api"
```

### 5. Deploy to Netlify

```bash
netlify deploy --prod
```

### 6. Get your Netlify URL

After deployment, you'll get a URL like `https://your-site-name.netlify.app`

## Environment Variables

| Variable             | Description                 | Example                                       |
| -------------------- | --------------------------- | --------------------------------------------- |
| VITE_API_URL         | Backend API URL             | `https://your-backend-url.up.railway.app/api` |
| VITE_IS_RAILWAY      | Flag for Railway deployment | `true`                                        |
| VITE_RAILWAY_API_URL | Railway API URL             | `https://your-backend-url.up.railway.app/api` |

## Build Configuration

The project uses Vite for building. The build command is:

```bash
npm run build
```

## API Endpoints

After deployment, your frontend will connect to:

- Backend API: `https://your-backend-url.up.railway.app/api`
- Health check: `https://your-backend-url.up.railway.app/api/health`

## Environment-Specific Configuration

The frontend automatically detects if it's running in production and connects to the Railway backend when deployed.
