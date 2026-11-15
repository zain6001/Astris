import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { createStore } from "./store/memoryStore.js";
import { createApiRouter } from "./routes/api.js";
import { startTelemetrySimulator } from "./services/telemetrySimulator.js";
import { createNasaWeatherService } from "./services/nasaDonki.js";

const isLocalProcess = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

export const createApp = () => {
  const app = express();
  const state = createStore();
  const nasaWeatherService = createNasaWeatherService();
  const allowedOrigin = process.env.CLIENT_ORIGIN;

  app.use(cors({ origin: allowedOrigin || true }));
  app.use(express.json());
  app.use("/api/v1", createApiRouter(state, nasaWeatherService));
  app.get("/health", (_req, res) => res.json({ ok: true, service: "astris-server" }));
  void nasaWeatherService.refresh();
  if (isLocalProcess) {
    setInterval(() => { void nasaWeatherService.refresh(); }, 10 * 60 * 1000);
  }
  if (isLocalProcess) {
    startTelemetrySimulator(state, nasaWeatherService);
  }

  return app;
};

const app = createApp();
export default app;

if (isLocalProcess) {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`ASTRIS server listening on port ${process.env.PORT || 5000}`);
  });
}
