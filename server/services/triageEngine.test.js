import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../store/memoryStore.js";
import { evaluateTelemetry } from "./triageEngine.js";

const reading = (overrides = {}) => ({
  astronautId: "ASTRO-01", timestamp: new Date().toISOString(), heartRateBpm: 70,
  systolicBp: 118, diastolicBp: 74, spO2Percent: 98, coreTempCelsius: 36.8,
  respirationRate: 16, ambientRadiationMSvDay: 0.38, cabinCO2MmHg: 2.4,
  dailyResistiveExerciseMin: 60, boneDensityRetentionScore: 96, sleepHours: 7.2,
  moodScore: 4, fatigueRating: 2, cognitiveReactionMs: 265, immuneSymptomScore: 0, ...overrides
});

test("classifies critical cardiovascular telemetry", () => {
  const store = createStore();
  const result = evaluateTelemetry(reading({ heartRateBpm: 145, spO2Percent: 90.2 }), store.astronauts[0], store);
  assert.equal(result.overallStatus, "CRITICAL");
  assert.equal(result.newAlerts[0].recommendedProtocolId, "PROT-CARDIO-01");
});

test("does not create duplicate unresolved alerts for one metric", () => {
  const store = createStore();
  const astronaut = store.astronauts[0];
  evaluateTelemetry(reading({ cabinCO2MmHg: 5.9 }), astronaut, store);
  const second = evaluateTelemetry(reading({ cabinCO2MmHg: 6.1 }), astronaut, store);
  assert.equal(store.alerts.filter((alert) => alert.metricName === "cabinCO2MmHg").length, 1);
  assert.equal(second.newAlerts.length, 0);
});

test("allows a new alert after the prior alert is resolved", () => {
  const store = createStore();
  const astronaut = store.astronauts[0];
  evaluateTelemetry(reading({ sleepHours: 5 }), astronaut, store);
  store.alerts[0].isResolved = true;
  const result = evaluateTelemetry(reading({ sleepHours: 5 }), astronaut, store);
  assert.equal(result.newAlerts.length, 1);
});
