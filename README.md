# Gali'Pet V2

Pet services marketplace for Morocco. Connects pet owners with professionals (vets, groomers, trainers, pet-sitters).

## Stack

| | |
|---|---|
| Frontend | React Native + Expo SDK 52, Expo Router, TypeScript, Zustand, Axios |
| Backend | Node.js + Express + TypeScript + Zod |
| Database | Supabase (PostgreSQL + Realtime + Auth) |
| Storage | Cloudinary |

## Structure

```
galipet-v2/
├── backend/     # Express API — 3-layer: routes → controllers → services
├── frontend/    # Expo app — two tab navigators (owner / pro)
├── GUIDE.md     # Full project reference (features, patterns, decisions)
```

## Roles

- **Owner** — finds pros, books services, manages pets
- **Professional** — manages bookings, calendar, dashboard

## Running locally

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in Supabase + Cloudinary keys
npm run dev            # runs on :3000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # fill in API URL + Supabase keys
npx expo start
```

## Features shipped

| Feature | Status |
|---------|--------|
| Auth (register, login, session) | ✅ |
| Profiles (owner & pro, working hours, certifications) | ✅ |
| Geo/map (Haversine, native map, pro search) | ✅ |
| Bookings (full lifecycle, 10 statuses) | ✅ |
| Messaging (real-time, Supabase Realtime) | ✅ |
| Reviews & ratings | ✅ |
| Booking detail & timeline | ✅ |
| Pro dashboard (KPIs, charts) | ✅ |
| Pet profiles (gallery, health docs, vaccinations) | ✅ |
| Pro calendar (week view) | ✅ |
| Notifications | ⬜ |
| Payments (Stripe) | ⬜ |
| Subscriptions | ⬜ |
| WAFs (virtual currency) | ⬜ |
| Settings & RGPD | ⬜ |
