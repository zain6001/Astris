import { appendReading } from "../store/memoryStore.js";
import { evaluateTelemetry } from "./triageEngine.js";

const baseReading = (astronaut, mode, nasaWeather) => {
  const t = Date.now() / 1000;
  const wave = Math.sin(t / 10);
  const reading = {
    id: `${astronaut.id}-${Date.now()}`, astronautId: astronaut.id, timestamp: new Date().toISOString(),
    heartRateBpm: Math.round(70 + wave * 5), systolicBp: 118, diastolicBp: 74, spO2Percent: 98,
    coreTempCelsius: 36.8, respirationRate: 16, ambientRadiationMSvDay: Number((0.38 + wave * 0.05).toFixed(2)),
    cabinCO2MmHg: 2.4, dailyResistiveExerciseMin: 60, boneDensityRetentionScore: 96, sleepHours: 7.2,
    moodScore: 4, fatigueRating: 2, cognitiveReactionMs: 265, immuneSymptomScore: 0
  };
  if (mode === "SOLAR_FLARE") Object.assign(reading, { ambientRadiationMSvDay: nasaWeather?.radiationRateMSvDay || 1.65, heartRateBpm: 104 });
  if (mode === "CARDIO_STRESS") Object.assign(reading, { heartRateBpm: 145, systolicBp: 154, spO2Percent: 90.2 });
  if (mode === "CABIN_CO2_SPIKE") Object.assign(reading, { cabinCO2MmHg: 5.9, respirationRate: 24, immuneSymptomScore: 5 });
  if (mode === "ISOLATION_FATIGUE") Object.assign(reading, { sleepHours: 4.1, moodScore: 2, fatigueRating: 5, cognitiveReactionMs: 510 });
  return reading;
};

export const startTelemetrySimulator = (store, nasaWeatherService) => setInterval(() => {
  for (const astronaut of store.astronauts) {
    const reading = baseReading(astronaut, store.simulationState.mode, nasaWeatherService.getLatest());
    appendReading(store, reading);
    evaluateTelemetry(reading, astronaut, store);
  }
}, 4000);
