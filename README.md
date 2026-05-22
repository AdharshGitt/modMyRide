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
