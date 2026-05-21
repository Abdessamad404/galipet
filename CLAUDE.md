# Gali'Pet V2 — Claude Context

## ⚠️ WORKFLOW — NEVER SKIP THIS ORDER

1. **User tests first** — wait, do NOT move on
2. **Fix bugs** reported by user
3. **User names the commit** — suggest a name, user approves/edits
4. **Then and only then** move to next feature

Do NOT propose the next feature before the commit is named. Do NOT start coding before the user says "go".

---

## Project Structure

- `frontend/` — Expo / React Native (TypeScript)
- `backend/` — Node.js / Express (TypeScript)

### Key paths
- `frontend/app/(owner)/` — owner tab group
- `frontend/app/(pro)/` — pro tab group
- `frontend/src/` — shared source: components, services, store, types, constants
- `@/*` alias → `src/*` (tsconfig paths)

### Important patterns
- **Store updates after PATCH**: use `setProfile(updated)` NOT `initialize()` — avoids form field reset
- **Web-compatible confirm**: `Platform.OS === 'web' ? window.confirm(msg) : Alert.alert(...)`
- **Navigation**: `router.push` creates history (back button works); `router.navigate` switches tabs without history
- **AppHeader**: `role="owner"` | `role="professional"` — owner gets CalendarDays→mes-reservations, pro gets BookOpen→reservations
- **Activity types valid values**: `sante | toilettage | pet-sitting | education` (not grooming/sitting — strip stale DB values)

### Working hours schema
```ts
{ lun: 'closed' | { open: 'HH:MM', close: 'HH:MM' }, mar: ..., ... }
```

### Tab structure
- **Owner**: Explorer | Mes Animaux | Profil | Gali'Pet
- **Pro**: Dashboard | Calendrier | Profil | Gali'Pet
- Hidden screens accessible via AppHeader icons or router.push

---

## Pending tasks (in priority order)

- **Task #28** — Remove 'both' role
- **F04** — Real calendar (hour grid 08h→20h, slot creation, 10 statuses)
- **F03** — Geo/map complete (Carte/Grille toggle, city selector, service filters)
- **F07** — Notifications (push FCM, in-app, badges)
- **F09** — Historique & suivi prestations
- **F12** — Payment (Stripe)
- **F11** — Subscriptions
- **F18** — WAFs
- **F19** — Settings
- **F15** — Security (rate limiting, RGPD)
- **F13** — Insurance
- **F14** — Marketplace
