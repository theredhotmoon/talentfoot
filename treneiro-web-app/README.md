# treneiro-web-app
Admin user: admin@admin.com 
Password: 1234


Make sure your Hostinger environment panel also has:

APP_URL = your actual Hostinger domain (e.g. https://yourdomain.com)
FRONTEND_URL = your frontend URL (e.g. https://yourdomain.com)
LOG_CHANNEL = stack
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

(Get these from Google Cloud Console → Create OAuth 2.0 Client ID → Authorized redirect URI = http://localhost:8000/api/auth/google/callback)
