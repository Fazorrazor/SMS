# 🚀 SMS App Deployment Guide (Render)

This guide provides step-by-step instructions to deploy your Stock Management System (SMS) to **Render**.

## 1. Prerequisites
- A [Render](https://render.com) account.
- Your project pushed to a **GitHub** or **GitLab** repository.
- A **PostgreSQL** database (you can create one on Render for free).

---

## 2. Backend Deployment (Web Service)

1. **New Web Service**: In Render dashboard, click **New +** > **Web Service**.
2. **Connect Repo**: Select your project repository.
3. **Settings**:
   - **Name**: `sms-backend` (or your choice).
   - **Environment**: `Node`.
   - **Root Directory**: `server` (CRITICAL).
   - **Build Command**: `npm install`.
   - **Start Command**: `node index.js`.
4. **Environment Variables**:
   Click **Advanced** > **Add Environment Variable**:
   - `DATABASE_URL`: Your PostgreSQL connection string (see below).
   - `PORT`: `5000`.
   - `NODE_ENV`: `production`.

### Database Setup
If using Render PostgreSQL:
1. Create a **New PostgreSQL**.
2. Once created, copy the **Internal Database URL** (or External if you need local access).
3. Paste this into the `DATABASE_URL` variable for your Web Service.

---

## 3. Update Frontend Config

Once your backend is live (e.g., `https://sms-backend-xyz.onrender.com`):

1. Open `src/config.ts` in your local code.
2. Update the production URLs:
```typescript
export const API_URL = import.meta.env.PROD
    ? 'https://your-backend-sm.onrender.com/api' // <-- REPLACE THIS
    : '/api';

export const SOCKET_URL = import.meta.env.PROD
    ? 'https://your-backend-sm.onrender.com'     // <-- REPLACE THIS
    : '';
```
3. Commit and push these changes to GitHub.

---

## 4. Frontend Deployment (Static Site)

1. **New Static Site**: In Render dashboard, click **New +** > **Static Site**.
2. **Connect Repo**: Select the same repository.
3. **Settings**:
   - **Name**: `sms-frontend`.
   - **Build Command**: `npm run build`.
   - **Publish Directory**: `dist`.
4. **Environment Variables**:
   - `NODE_ENV`: `production`.

---

## 5. Summary of URLs

- **Development**:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:5000`
- **Production**:
  - Frontend: `https://sms-frontend.onrender.com`
  - Backend: `https://sms-backend.onrender.com`

## 🛠 Troubleshooting
- **Database Connection**: If the server fails to start, check if your `DATABASE_URL` is correct and if Render's IP is allowed (usually automatic for internal services).
- **CORS Issues**: The backend is configured to allow all origins (`origin: "*"`), which is fine for getting started on Render.
- **Port**: Render automatically assigns a port. The code uses `process.env.PORT || 5000`, which is standard.
