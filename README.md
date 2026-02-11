# 🚀 SMS - Stock Management System

A modern, robust Stock Management System built with React, TypeScript, Vite, and Node.js.

## ✨ Features

- 📦 **Inventory Management**: Real-time tracking of products, SKUs, and stock levels.
- 💰 **Sales Tracking**: Complete POS system with payment method support (Cash, Card, Transfer).
- 📊 **Reports & Analytics**: Daily summaries, revenue tracking, and inventory valuation.
- 👤 **User Management**: Role-based access control (Admin/Staff).
- 🌙 **Modern UI**: Tailored theme with dark/light mode and rich micro-interactions.
- ⚡ **Real-time Updates**: Powered by Socket.io for instant synchronization across devices.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: PostgreSQL (Production) / SQLite (Local development).
- **Deployment**: GitHub Pages (Frontend) & Render (Backend).

## 🚀 Deployment

### Frontend (GitHub Pages)
The frontend is configured to deploy automatically via **GitHub Actions** on every push to the `main` branch.
- **SPA Support**: Includes a custom `404.html` fallback to ensure `BrowserRouter` works seamlessly on page refreshes.
- **Config**: Ensure `base: '/SMS/'` in `vite.config.ts` matches your repository name.

### Backend (Render)
This project includes a `render.yaml` Blueprint for one-click deployment.
1. Connect your GitHub repo to **Render**.
2. Render will automatically detect the Blueprint and set up:
   - A Node.js Web Service for the backend.
   - A managed PostgreSQL database.
3. Once deployed, update `src/config.ts` with your new backend URL.

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Fazorrazor/SMS.git
   cd SMS
   ```

2. **Setup Backend**:
   ```bash
   cd server
   npm install
   # Create a .env file with DATABASE_URL
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd ..
   npm install
   npm run dev
   ```

## 📝 License
MIT
