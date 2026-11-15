import { protocols } from "../data/protocols.js";

const profiles = [
  { id: "ASTRO-01", fullName: "Cmdr. Elena Vance", role: "Mission Commander", missionDay: 142, baselineHeartRate: 68, cumulativeRadiationMSv: 64.2, safeMissionRadiationLimitMSv: 600 },
  { id: "ASTRO-02", fullName: "Dr. Marcus Chen", role: "Flight Surgeon & Payload Specialist", missionDay: 142, baselineHeartRate: 72, cumulativeRadiationMSv: 61.8, safeMissionRadiationLimitMSv: 600 }
];

const makeReading = (astronaut, timestamp, index = 0) => {
  const wave = Math.sin(index / 4);
  return {
    id: `${astronaut.id}-${Date.parse(timestamp)}-${index}`, astronautId: astronaut.id, timestamp,
    heartRateBpm: Math.round(70 + wave * 4), systolicBp: 116 + Math.round(wave * 4), diastolicBp: 74,
    spO2Percent: 98, coreTempCelsius: 36.8, respirationRate: 16,
    ambientRadiationMSvDay: Number((0.38 + wave * 0.04).toFixed(2)), cabinCO2MmHg: Number((2.4 + wave * 0.2).toFixed(2)),
    dailyResistiveExerciseMin: 60, boneDensityRetentionScore: 96, sleepHours: 7.2, moodScore: 4,
    fatigueRating: 2, cognitiveReactionMs: 265, immuneSymptomScore: 0
  };
};

export const createStore = () => {
  const now = Date.now();
  const telemetryReadings = [];
  for (const astronaut of profiles) {
    for (let i = 0; i < 48; i += 1) {
      telemetryReadings.push(makeReading(astronaut, new Date(now - (47 - i) * 30 * 60 * 1000).toISOString(), i));
    }
  }
  return { astronauts: structuredClone(profiles), telemetryReadings, alerts: [], protocols, simulationState: { mode: "NOMINAL", updatedAt: new Date().toISOString() } };
};

export const appendReading = (store, reading) => {
  store.telemetryReadings.push(reading);
  const astronautReadings = store.telemetryReadings.filter((item) => item.astronautId === reading.astronautId);
  if (astronautReadings.length > 200) {
    const removeId = astronautReadings[0].id;
    store.telemetryReadings = store.telemetryReadings.filter((item) => item.id !== removeId);
  }
};

export const resetStore = () => createStore();
