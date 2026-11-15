import { Router } from "express";
import { appendReading, resetStore } from "../store/memoryStore.js";
import { evaluateTelemetry, statusForAstronaut } from "../services/triageEngine.js";

export const createApiRouter = (state, nasaWeatherService) => {
  const router = Router();
  const dashboard = (id) => {
    const astronaut = state.astronauts.find((item) => item.id === id);
    if (!astronaut) return null;
    const readings = state.telemetryReadings.filter((item) => item.astronautId === id).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const activeAlerts = state.alerts.filter((item) => item.astronautId === id && !item.isResolved).sort((a, b) => (b.severity === "CRITICAL") - (a.severity === "CRITICAL"));
    const riskScores = {};
    for (const alert of activeAlerts) riskScores[alert.category] = Math.max(riskScores[alert.category] || 0, alert.severity === "CRITICAL" ? 1 : 0.6);
    return { astronaut, overallStatus: statusForAstronaut(id, state), riskScores, latestReading: readings.at(-1), recentReadings: readings.slice(-30), activeAlerts, protocols: state.protocols };
  };
  router.get("/astronauts", (_req, res) => res.json(state.astronauts));
  router.get("/astronauts/:id/dashboard", (req, res) => { const result = dashboard(req.params.id); return result ? res.json(result) : res.status(404).json({ error: "Astronaut not found" }); });
  router.post("/telemetry/ingest", (req, res) => {
    const reading = { ...req.body, id: req.body.id || `MAN-${Date.now()}`, timestamp: req.body.timestamp || new Date().toISOString() };
    const astronaut = state.astronauts.find((item) => item.id === reading.astronautId);
    if (!astronaut) return res.status(400).json({ error: "Valid astronautId is required" });
    appendReading(state, reading); const result = evaluateTelemetry(reading, astronaut, state);
    return res.json({ ...result, dashboard: dashboard(astronaut.id) });
  });
  router.post("/telemetry/sync-batch", (req, res) => {
    const readings = Array.isArray(req.body.readings) ? [...req.body.readings].sort((a, b) => a.timestamp.localeCompare(b.timestamp)) : [];
    let syncedCount = 0; let newAlertsCount = 0;
    for (const reading of readings) {
      const astronaut = state.astronauts.find((item) => item.id === reading.astronautId);
      if (!astronaut) continue;
      appendReading(state, { ...reading, id: reading.id || `SYNC-${Date.now()}-${syncedCount}` });
      newAlertsCount += evaluateTelemetry(reading, astronaut, state).newAlerts.length; syncedCount += 1;
    }
    return res.json({ syncedCount, newAlertsCount });
  });
  router.post("/alerts/:alertId/resolve", (req, res) => {
    const alert = state.alerts.find((item) => item.id === req.params.alertId);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    alert.isResolved = true; return res.json({ alerts: state.alerts.filter((item) => item.astronautId === alert.astronautId && !item.isResolved) });
  });
  router.get("/simulation/state", (_req, res) => res.json(state.simulationState));
  router.get("/space-weather/latest", (_req, res) => res.json({ status: nasaWeatherService.getStatus(), event: nasaWeatherService.getLatest(), solarContext: nasaWeatherService.getSolarContext() }));
  router.post("/simulation/mode", (req, res) => {
    const modes = ["NOMINAL", "SOLAR_FLARE", "CARDIO_STRESS", "CABIN_CO2_SPIKE", "ISOLATION_FATIGUE"];
    if (!modes.includes(req.body.mode)) return res.status(400).json({ error: "Unsupported simulation mode" });
    state.simulationState = { mode: req.body.mode, updatedAt: new Date().toISOString() }; return res.json(state.simulationState);
  });
  router.post("/simulation/reset", (_req, res) => { const fresh = resetStore(); Object.keys(state).forEach((key) => { state[key] = fresh[key]; }); return res.json(state.simulationState); });
  return router;
};
