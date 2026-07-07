<div align="center">
  <img width="1000" alt="QuickVet Preview" src="preview.jpg" />
  <h1>QuickVet</h1>
  <p><strong>Find nearby veterinarians, book appointments, and request emergency pet care — all in one platform.</strong></p>

  ![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
  ![Version](https://img.shields.io/badge/Version-1.0.0-blue)
  ![License](https://img.shields.io/badge/License-Private-lightgrey)
</div>

---

# QuickVet

QuickVet is a pet healthcare marketplace and booking platform:
- **Browse clinics nearby** (geo/location-assisted listing)
- **Book appointments** for clinic visits / home visits
- **Request emergency care (SOS)**
- **Role-based workflows** for pet owners, veterinarians, and admins
- **Vaccination appointment scheduling + records** (Temporal-backed workflows if enabled)
- **Clinic verification document upload** (Cloudinary-backed)

This repository is deployed using a **split architecture**:
- **Frontend:** Vercel
- **Backend/API:** Render
- **Database:** Supabase PostgreSQL (compatible with `DATABASE_URL`)

---

## Project Status

| Area | Status | Notes |
|------|--------|-------|
| Frontend (React SPA) | ✅ Complete | All views, modals, dashboards functional |
| Backend (Express API) | ✅ Complete | REST API + JWT auth + role guards |
| Database (PostgreSQL) | ✅ Complete | Drizzle ORM schema + relations |
| Authentication | ✅ Complete | Signup/login/password reset/roles + Google OAuth |
| Booking System | ✅ Complete | Clinic visits + home visits + status |
| Emergency Alerts | ✅ Complete | Emergency request + clinic acceptance workflow |
| Interactive Map | ✅ Complete | Leaflet map with clinic markers |
| Clinic Reviews | ✅ Complete | Star ratings + average rating calculation |
| Vet Dashboard | ✅ Complete | Manage bookings & emergencies + analytics |
| User Dashboard | ✅ Complete | Pets, favorites, appointment & emergency history |
| Vaccinations | ✅ Complete | Appointment create + Temporal workflows optional |
| Deployment | ✅ Ready | Vercel (frontend) + Render (backend) + Supabase (DB) |

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
│                                                                     │
│  React SPA (Vite + Tailwind)                                       │
│  - fetch() calls backend API                                      │
│  - Auth cookie is managed by backend (httpOnly)                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVER (Express.js)                           │
│                                                                     │
│  - Helmet security headers                                         │
│  - CORS allow-list (frontend origins)                             │
│  - Auth: JWT cookie + role-based access control                  │
│  - DB: Drizzle ORM on top of pg pool                             │
│  - Documents: Cloudinary (verification uploads)                  │
│  - Vaccinations: Temporal integration (graceful fallback)       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PostgreSQL / Supabase                              │
│  Tables: users, vet_clinics, pets, favorite_clinics,              │
│          clinic_reviews, bookings, emergency_requests,            │
│          vaccination_appointments, vaccination_records            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### 1) Authentication & authorization
- Backend signs **HS256 JWT** and stores it as a **secure `httpOnly` cookie** (`quickvet_auth`).
- Supported roles in API/UI:
  - `pet_owner`
  - `veterinarian`
  - `admin`
- Authorization is enforced via middleware:
  - `authenticateToken` validates JWT cookie
  - `requireRole(...)` restricts vet-only/admin-only routes

### 2) Tenant isolation
To prevent cross-user data leakage:
- **Pet owners** can only access their own bookings & emergencies (filtered by `petOwnerEmail` / `pet_owner_id`).
- **Veterinarians** can access clinic-scoped bookings & emergencies (filtered by `clinicId`).
- **Admins** can access broader datasets.

### 3) Emergency (SOS) flow
- A pet owner (or guest via app UI) creates an emergency request.
- Veterinarians can update the emergency status and set `acceptedByClinicId`.

### 4) Vaccinations (Temporal optional)
- Backend creates vaccination appointments in PostgreSQL.
- If Temporal client is available/configured, it starts workflows for reminders.
- If Temporal is not available, the app still works (graceful degradation).

---

## Tech Stack

### Frontend
- **React 19**
- **Vite 6**
- **Tailwind CSS 4**
- **Leaflet**

### Backend
- **Express 4**
- **Drizzle ORM**
- **pg** (PostgreSQL pool)
- **bcryptjs**
- **JWT (HS256) using Node `crypto`**
- **Cloudinary** (documents)
- **Temporal** (workflows; optional runtime dependency)

### Database
- **Supabase PostgreSQL** (use `DATABASE_URL`)

---

## Database Schema

Core tables:
- `users`
- `vet_clinics`
- `pets`
- `favorite_clinics`
- `clinic_reviews`
- `bookings`
- `emergency_requests`

Vaccination tables:
- `vaccination_appointments`
- `vaccination_records`

Schema and relations are defined in `src/server/schema.ts` (Drizzle).

---

## API Endpoints

### Public (No auth required)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/google/start` | Start Google OAuth (server-side cookie state) |
| GET | `/api/auth/google/callback` | OAuth callback (sets auth cookie) |
| POST | `/api/auth/signup` | Create user |
| POST | `/api/auth/login` | Login (sets auth cookie) |
| POST | `/api/auth/logout` | Logout (clears auth cookie) |
| POST | `/api/auth/forgot-password` | Initiate reset (simulated link/log) |
| POST | `/api/auth/verify-reset-token` | Validate reset token |
| POST | `/api/auth/reset-password` | Complete password reset |
| GET | `/api/clinics` | List clinics |
| GET | `/api/clinics/:id/reviews` | Read clinic reviews |

### Authenticated (JWT cookie required)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/user/me` | Current user profile + pets + favorites |
| POST | `/api/user/pets` | Add a pet |
| POST | `/api/user/favorites` | Toggle clinic favorite |
| POST | `/api/clinics` | Create clinic verification profile |
| POST | `/api/clinics/:id/verification` | Update clinic verification (admin) |
| POST | `/api/clinics/:id/reviews` | Submit clinic review |
| GET | `/api/bookings` | List bookings (tenant-scoped) |
| POST | `/api/bookings` | Create booking |
| POST | `/api/bookings/:id/status` | Update booking status (veterinarian) |
| GET | `/api/emergency` | List emergencies (tenant-scoped) |
| POST | `/api/emergency` | Create emergency request |
| POST | `/api/emergency/:id/status` | Update emergency status (veterinarian) |

### Cloudinary documents
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/documents/upload` | Upload verification docs (vets/admin) |
| DELETE | `/api/documents/:publicId` | Delete doc from Cloudinary |
| GET | `/api/documents/:publicId/signed-url` | Admin signed URL for viewing |
| GET | `/api/documents/:publicId/download` | Admin download redirect |

---

## Local Development

### Prerequisites
- **Node.js 18+**
- **PostgreSQL 14+**

### 1) Clone
```bash
git clone https://github.com/Abhishek-gupta18/QuickVet.git
cd QuickVet
```

### 2) Install
```bash
npm install
```

### 3) Configure environment
- Create `.env` from `.env.example`:
  ```bash
  cp .env.example .env
  ```

Minimum required:
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`

Recommended for dev:
- `FRONTEND_URL=http://localhost:5173`

### 4) Database
```bash
npm run db:push
npm run db:seed
```

### 5) Run
```bash
npm run dev
```

---

## Production Deployment (Vercel + Render + Supabase)

### Important variables (how the split works)
- **Frontend (Vercel):** uses `VITE_API_URL` to know where the API lives.
- **Backend (Render):** uses `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.
- **Supabase:** provides PostgreSQL + `DATABASE_URL`.

### Vercel (Frontend) setup
1. Create a Vercel project and connect the repo.
2. Build command: `npm run build`
3. Output will be the default Vite build (`dist/`).
4. Set env vars on Vercel:
   - `VITE_API_URL=https://<your-render-backend>.onrender.com`

### Render (Backend) setup
1. Create a **Web Service** on Render.
2. Build command: `npm run build`
3. Start command: `npm start`
4. Set required env vars in Render:
   - `NODE_ENV=production`
   - `DATABASE_URL=<supabase connection string>`
   - `JWT_SECRET=<random secret>`
   - `FRONTEND_URL=https://<your-vercel-frontend>.vercel.app`
   - `BACKEND_URL=https://<your-render-backend>.onrender.com` (recommended)

Optional (if enabled/needed):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Supabase setup
1. Create a Supabase project and Postgres database.
2. Copy the connection string (`DATABASE_URL`).
3. Deploy schema using Drizzle locally, then commit migrations, OR run migrations in a Render/CI step:
   - `npm run db:push` (dev-like)
   - `npm run db:migrate` (preferred for production)

---

## Temporal (Optional)
- Start Temporal worker:
  ```bash
  npm run temporal:worker
  ```

If Temporal is not running/configured, the backend continues to operate; Temporal-based features will simply not run.

---

## Security Notes
- Auth routes are rate-limited.
- JWT is stored in an `httpOnly` cookie.
- Backend uses a CORS allow-list (must include your Vercel domain via `FRONTEND_URL`).

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server (Express + Vite middleware) |
| `npm run build` | Build frontend + bundled server |
| `npm start` | Run production server |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema (dev) |
| `npm run db:seed` | Seed DB |
| `npm run db:studio` | Open Drizzle Studio |

---

## Contributing
1. Fork repository
2. Create feature branch
3. Commit changes
4. Open PR

---

## License
MIT License. See `LICENSE` file for details.

