# ModMyRide 🚗🏍️

**ModMyRide** is a premium, AI-powered automotive performance tuning and recommendation platform engineered specifically for Indian car and bike enthusiasts. By combining mechanical engineering compatibility rules, a comprehensive MongoDB catalog of vehicles and aftermarket parts, and state-of-the-art Generative AI, ModMyRide creates custom tuning roadmaps based on budget, goals, and driving styles.

---

## 🔥 Key Features

- **🎯 Precision 4-Step Recommendation Wizard**: Build your dream machine by selecting a vehicle, choosing performance goals (Handling, Acceleration, Track, or Off-road), setting a budget in INR, and receiving a complete compatible parts roadmap.
- **🤖 Gemini-Powered AI Advisor**: Have a direct chat with our custom-tuned mechanical engineering AI model to ask for custom parts recommendation, compatibility checks, and phase-by-phase building advice.
- **💾 Saved Profiles**: Save your customized configurations, track total budget, review parts lists, and manage multiple builds (both Cars and Bikes) in one high-octane dashboard.
- **🔒 Smart Auth & Navigation Guarding**: Integrated role-based authentication that dynamically redirects users back to their requested actions (AI Advisor, Saved Profiles, Tuning Wizard) immediately after a successful sign-in.
- **🎨 Rich High-Octane Aesthetics**: Stunning, responsive dark-themed visual experience with modern carbon accents, red highlights, glassmorphic menus, and smooth micro-animations.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), React Router v6, TailwindCSS/Vanilla CSS, Oswald & Inter custom typography.
- **Backend**: Node.js, Express.js, JWT Authentication.
- **Database**: MongoDB (Mongoose), featuring structured schemas for:
  - `Users` (Admin & standard enthusiast accounts)
  - `Vehicles` (Cars and Bikes sold in the Indian market)
  - `Parts` (Aftermarket performance components, compatibility mapping, and prices)
  - `Profiles` (Saved configurations and tuning roadmaps)
- **AI Integration**: Gemini AI (Vertex AI/Google AI Studio) tuned for mechanical advice.

---

## 📂 Project Structure

```text
ModMyRide/
├── client/                     # Frontend React Application
│   ├── public/                 # Static assets
│   └── src/
│       ├── assets/             # Images and local media
│       ├── components/         # Reusable UI Components (Navbar, etc.)
│       ├── pages/              # Main App Pages (Tuning, AIAdvisor, Auth, SavedProfiles, Landing)
│       ├── services/           # Backend API Connections
│       ├── App.jsx             # React Routes
│       └── main.jsx            # Entry point
│
├── server/                     # Backend Node/Express API
│   └── src/
│       ├── config/             # DB & Env Configurations
│       ├── controllers/        # Route Handlers (Auth, Profile, Part compatibility)
│       ├── middleware/         # Auth guarding, CORS validation
│       ├── models/             # Mongoose Schemas (User, Vehicle, Part, Profile)
│       ├── routes/             # API Endpoints
│       ├── app.js              # Express app setup
│       └── server.js           # Server startup script
│
├── package.json                # Project-wide script orchestrator
└── README.md                   # You are here!
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI
- Gemini API Key

### 📦 1. Installation
Install all dependencies for both the `client` and `server` folders using the top-level orchestration script:
```bash
npm run install:all
```

### ⚙️ 2. Environment Variables Configuration

Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/modmyride
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 🏎️ 3. Seeding the Database (Optional)
If you have a DB seeding script, run it in the server directory to populate default vehicles (e.g. Honda City, KTM 390 ADV) and aftermarket parts (e.g. Red Rooster exhaust, K&N filters, Brembo brakes):
```bash
cd server
npm run seed  # Or the specific seed command for your project
```

### 🚦 4. Launching the Platform
Start both the React development server and the Node backend concurrently using a single command:
```bash
npm run dev
```

- **Client Web Portal**: `http://localhost:5173/` (or auto-allocated port)
- **Server API Engine**: `http://localhost:5000/`

---

## ⚙️ Engineering Rules

1. **Strict Compatibility Checking**: Parts are bound to specific `vehicleType` (Car/Bike), `make`, and `compatibility` arrays to prevent cross-contamination (e.g. installing a bike exhaust on a hatchback).
2. **Dynamic INR Formatting**: All calculations, additions, and remaining budgets are automatically localized to the Indian Rupee (INR) system.
3. **Admin Controls**: Dedicated dashboard for administrators to seed new parts, update pricing, and monitor active configuration counts.
