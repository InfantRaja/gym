# LimitBreak

A standalone fitness tracker built with HTML, CSS, JavaScript modules, and an optional local Express/MongoDB API. Browser localStorage remains an offline cache.

Run `npm install`, copy `.env.example` to `.env`, set `MONGODB_URI` and a long random `SESSION_SECRET`, then run `npm start`. Open `http://localhost:3000/login.html`. New users can create an account from the sign-in page. Passwords are hashed and account fitness state is stored separately in MongoDB. Keep `.env` private and never commit it. If no MongoDB URI is configured, the demo remains available using localStorage, but account registration requires MongoDB.

The demo account is `demo@limitbreak.app` / `limitbreak`. This starter is intended for local use; add deployment-grade protections before exposing it publicly.

## Pages

- `login.html`: sign-in screen with demo access and MongoDB-backed accounts
- `register.html`: create a database-backed account
- `home.html`: social workout feed and suggested athletes; served at `/`
- `index.html`: dashboard, nutrition, activity, and recent sessions
- `workout.html`: Push/Pull/Legs sessions, set tracking, timers, notes, and save/exit actions
- `exercises.html`: searchable and filterable exercise database
- `progress.html`: weight chart, volume, workout history, and personal records
- `profile.html`: editable profile and nutrition targets
