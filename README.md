# MERN Monolithic Template

Standard MERN starter with separate `client` and `server` folders managed in one repository.

## Folder Structure

```text
ModMyRide/
  client/
    public/
    src/
      components/
      pages/
      services/
      App.jsx
      main.jsx
      index.css
  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      app.js
      server.js
  package.json
```

## Quick Start

1. Install all dependencies:

```bash
npm run install:all
```

2. Create environment files:

- `server/.env` from `server/.env.example`
- `client/.env` from `client/.env.example`

3. Run both apps:

```bash
npm run dev
```

## Default Ports

- Client: `5173`
- Server: `5000`
