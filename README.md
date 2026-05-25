# ModMyRide

ModMyRide is a full-stack automotive performance tuning platform built for Indian car and bike enthusiasts. It combines a curated catalog of vehicles and aftermarket parts with AI-driven recommendations to help users plan realistic, budget-aware modification builds.

The platform handles compatibility validation between vehicles and parts, generates phased upgrade roadmaps, and provides a conversational AI advisor for personalized tuning guidance — all priced and formatted for the Indian market.

---

## Features

- **4-Step Recommendation Wizard** — Select a vehicle, define performance goals (handling, acceleration, track, or off-road), set a budget in INR, and receive a compatible parts roadmap with cost breakdowns.
- **AI Advisor** — Chat interface powered by Gemini AI, configured with mechanical engineering context to answer questions about part compatibility, build sequencing, and performance trade-offs.
- **Saved Profiles** — Store and manage multiple vehicle configurations, review parts lists, and track spending across builds.
- **Authentication and Route Guarding** — JWT-based auth with role separation (admin/user). Unauthenticated users are redirected back to their intended page after login.
- **Admin Dashboard** — Administrative tools for managing vehicles, parts, user accounts, and monitoring platform activity.

---

## Tech Stack

| Layer       | Technologies                                                  |
|-------------|---------------------------------------------------------------|
| Frontend    | React (Vite), React Router v6, Vanilla CSS, Oswald & Inter fonts |
| Backend     | Node.js, Express.js, JWT authentication                       |
| Database    | MongoDB with Mongoose (Users, Vehicles, Parts, Profiles)      |
| AI          | Google Gemini API                                             |

---

## Project Structure

```
ModMyRide/
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       ├── assets/             # Images and static media
│       ├── components/         # Shared UI components (Navbar, etc.)
│       ├── pages/              # Page-level components
│       ├── services/           # API service layer
│       ├── App.jsx             # Route definitions
│       └── main.jsx            # Application entry point
│
├── server/                     # Express backend
│   └── src/
│       ├── config/             # Database and environment config
│       ├── controllers/        # Request handlers
│       ├── middleware/         # Auth and CORS middleware
│       ├── models/             # Mongoose schemas
│       ├── routes/             # API route definitions
│       ├── app.js              # Express app configuration
│       └── server.js           # Server entry point
│
├── package.json                # Root-level scripts (install, dev)
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18 or later
- MongoDB (local instance or Atlas connection string)
- A Gemini API key from Google AI Studio

### 1. Install Dependencies

From the project root, install dependencies for both the client and server:

```bash
npm run install:all
```

### 2. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/modmyride
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Seed the Database (Optional)

Populate the database with sample vehicles and parts data:

```bash
cd server
npm run seed
```

### 4. Run the Application

Start both the frontend and backend concurrently:

```bash
npm run dev
```

Once running:
- Frontend: `http://localhost:5173/`
- API server: `http://localhost:5000/`

---

## Design Decisions

- **Strict compatibility enforcement** — Parts are mapped to specific vehicle types, makes, and models. The system prevents invalid combinations (e.g., a bike exhaust being recommended for a sedan).
- **INR-native pricing** — All budget calculations, part costs, and remaining balances are formatted in Indian Rupees throughout the interface.
- **Role-based access** — Admins have a separate dashboard for managing the parts catalog, vehicle database, and user accounts. Standard users interact only with the tuning wizard, AI advisor, and their saved profiles.
