# ASTRIS

Offline-first astronaut health monitoring and autonomous triage MVP for the 2026 NASA Space Apps Challenge.

## Run

```powershell
npm run install:all
Start-Process powershell -ArgumentList "-NoExit", "npm start --prefix server"
Start-Process powershell -ArgumentList "-NoExit", "npm run dev --prefix client"
```

Server: `http://localhost:5000`  
Client: `http://localhost:5173`

## Vercel deployment

Deploy `server` and `client` as separate Vercel projects:

1. For the server project, set **Root Directory** to `server`. Vercel will use
   `server/api/index.js` as the function entrypoint.
2. For the client project, set **Root Directory** to `client` and add the
   environment variable `VITE_API_URL` with the server URL ending in
   `/api/v1`, for example `https://astris-server.vercel.app/api/v1`.
3. Add `CLIENT_ORIGIN` to the server project with the deployed client URL,
   then redeploy both projects.

The server uses an in-memory store, so its state is temporary and can differ
between serverless instances. It is suitable for the demo, but persistent
production telemetry requires a database.

The server uses only a pre-seeded in-memory store. The client includes a localStorage offline queue, local threshold checks, live polling, hazard simulation, charts, alert resolution, self-assessment submission, and a five-trial PVT reaction test.

The app first requests real public NASA DONKI solar-flare data. If DONKI is unavailable, it requests NASA POWER solar-irradiance context. If NASA is temporarily unavailable, the server uses the last cached NASA event; if no cache exists, it clearly reports a synthetic fallback for the demo. Set `NASA_API_KEY` to a NASA API key for higher DONKI request limits; `DEMO_KEY` is used by default. NASA POWER values are displayed as solar context and are not represented as astronaut radiation dose.

## Verification

```powershell
npm test --prefix server
npm run build --prefix client
```

## Judge demo

1. Start in **Nominal Orbit** and show the three live charts.
2. Select **Solar Flare Event** or **Cardio Arrhythmia**.
3. Open the generated alert, complete the protocol checklist, and resolve it.
4. Toggle **Comms Blackout**, submit a self-check, and show the queued-record counter.
5. Run the five-trial PVT; its average reaction time is queued or submitted as telemetry.
6. Reset the simulation to return to a clean nominal state.

## Scientific basis and safety

ASTRIS is a hackathon clinical decision-support prototype, not a medical device or replacement for flight surgeons, mission control, or emergency procedures. Thresholds are deterministic demonstration rules and must be clinically validated before operational use.

The domain model is informed by NASA Human Research Program concerns including space radiation, behavioral health, cardiovascular fluid shifts, bone loss, and closed-environment hazards:





- [NASA Human Research Program](https://www.nasa.gov/hrp/)
- [NASA Evidence Book: Behavioral Health and Performance](https://humanresearchroadmap.nasa.gov/evidence/)
- [NASA Evidence Book: Space Radiation](https://humanresearchroadmap.nasa.gov/evidence/)
- [NASA Human Integration Design Handbook](https://www.nasa.gov/reference/human-integration-design-handbook/)
- [NASA DONKI Space Weather API](https://ccmc.gsfc.nasa.gov/DONKI/)
- [NASA POWER Data Access Viewer](https://power.larc.nasa.gov/)

All telemetry in this MVP is synthetic. No real astronaut or patient data is collected.
