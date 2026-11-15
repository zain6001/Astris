const severityRank = { CAUTION: 1, CRITICAL: 2 };
const checks = [
  { category: "Cardiovascular", metricName: "heartRateBpm", protocol: "PROT-CARDIO-01", caution: (r) => r.heartRateBpm > 105 || r.heartRateBpm < 50 || r.systolicBp > 140, critical: (r) => r.heartRateBpm > 135 || r.heartRateBpm < 42 || r.spO2Percent < 91, value: (r) => r.heartRateBpm, threshold: 105 },
  { category: "Radiation", metricName: "ambientRadiationMSvDay", protocol: "PROT-RAD-01", caution: (r) => r.ambientRadiationMSvDay > 0.65, critical: (r) => r.ambientRadiationMSvDay > 1.2, value: (r) => r.ambientRadiationMSvDay, threshold: 0.65 },
  { category: "Musculoskeletal", metricName: "dailyResistiveExerciseMin", protocol: "PROT-MUSC-01", caution: (r) => r.dailyResistiveExerciseMin < 45 || r.boneDensityRetentionScore < 92, critical: (r) => r.dailyResistiveExerciseMin < 20 || r.boneDensityRetentionScore < 85, value: (r) => r.dailyResistiveExerciseMin, threshold: 45 },
  { category: "Behavioral", metricName: "cognitiveReactionMs", protocol: "PROT-BEHAV-01", caution: (r) => r.sleepHours < 6 || r.moodScore <= 2 || r.cognitiveReactionMs > 380, critical: (r) => r.sleepHours < 4.5 || r.fatigueRating >= 5 || r.cognitiveReactionMs > 480, value: (r) => r.cognitiveReactionMs, threshold: 380 },
  { category: "Immune", metricName: "cabinCO2MmHg", protocol: "PROT-IMMUNE-01", caution: (r) => r.coreTempCelsius > 37.6 || r.cabinCO2MmHg > 3.8 || r.immuneSymptomScore >= 4, critical: (r) => r.coreTempCelsius > 38.5 || r.cabinCO2MmHg > 5.2 || r.immuneSymptomScore >= 7, value: (r) => r.cabinCO2MmHg, threshold: 3.8 }
];

export const evaluateTelemetry = (reading, astronaut, store) => {
  astronaut.cumulativeRadiationMSv += Number(reading.ambientRadiationMSvDay || 0) * 0.02;
  const newAlerts = [];
  for (const check of checks) {
    const severity = check.critical(reading) ? "CRITICAL" : check.caution(reading) ? "CAUTION" : null;
    if (!severity) continue;
    const duplicate = store.alerts.some((alert) => alert.astronautId === astronaut.id && alert.metricName === check.metricName && !alert.isResolved);
    if (duplicate) continue;
    const alert = {
      id: `ALT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, astronautId: astronaut.id,
      timestamp: reading.timestamp, category: check.category, severity, metricName: check.metricName,
      recordedValue: check.value(reading), thresholdValue: check.threshold,
      message: `${check.category} threshold exceeded. Review the recommended intervention protocol.`,
      recommendedProtocolId: check.protocol, isResolved: false
    };
    store.alerts.push(alert);
    newAlerts.push(alert);
  }
  const active = store.alerts.filter((alert) => alert.astronautId === astronaut.id && !alert.isResolved);
  const overallStatus = active.some((alert) => alert.severity === "CRITICAL") ? "CRITICAL" : active.length ? "CAUTION" : "NOMINAL";
  const riskScores = Object.fromEntries(checks.map((check) => {
    const domainAlerts = active.filter((alert) => alert.category === check.category);
    const score = domainAlerts.length ? (domainAlerts.some((alert) => alert.severity === "CRITICAL") ? 1 : 0.6) : 0.08;
    return [check.category, score];
  }));
  return { overallStatus, riskScores, newAlerts };
};

export const statusForAstronaut = (astronautId, store) => {
  const active = store.alerts.filter((alert) => alert.astronautId === astronautId && !alert.isResolved);
  return active.some((a) => a.severity === "CRITICAL") ? "CRITICAL" : active.length ? "CAUTION" : "NOMINAL";
};
