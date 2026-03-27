@echo off
echo Starting deployment process...

echo Deploying Backend to Railway...
cd backend
railway login
railway deploy

echo Deploying Frontend to Netlify...
cd ../frontend
netlify env:set VITE_API_URL "https://your-backend-url.up.railway.app/api"
netlify env:set VITE_IS_RAILWAY true
netlify env:set VITE_RAILWAY_API_URL "https://your-backend-url.up.railway.app/api"
netlify deploy --prod

echo Deployment Complete!
echo Backend: https://your-backend-url.up.railway.app
echo Frontend: https://your-site-name.netlify.app
echo API: https://your-backend-url.up.railway.app/api
echo Documentation: Check README files in backend/ and frontend/ directories
echo Your Cricket League App is now live!