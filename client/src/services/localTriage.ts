export const localTriage = (reading: Record<string, number>) => {
  const warnings: string[] = [];
  if (reading.heartRateBpm > 135 || reading.spO2Percent < 91) warnings.push("CRITICAL cardiovascular threshold");
  if (reading.cabinCO2MmHg > 5.2) warnings.push("CRITICAL cabin CO2 threshold");
  if (reading.cognitiveReactionMs > 480 || reading.fatigueRating >= 5) warnings.push("CRITICAL cognitive threshold");
  return warnings;
};
