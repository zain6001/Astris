const DONKI_URL = "https://api.nasa.gov/DONKI/FLR";
const POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";

const flareIntensity = (classType = "") => {
  const magnitude = Number.parseFloat(classType.slice(1)) || 0;
  if (classType.startsWith("X")) return Math.min(1.85, 1.35 + magnitude * 0.1);
  if (classType.startsWith("M")) return Math.min(1.2, 0.7 + magnitude * 0.05);
  return 0.65;
};

export const createNasaWeatherService = () => {
  let latest = null;
  let solarContext = null;
  let status = { source: "UNAVAILABLE", checkedAt: null, message: "NASA DONKI data has not been requested yet." };

  const refresh = async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const url = `${DONKI_URL}?startDate=${startDate.toISOString().slice(0, 10)}&endDate=${endDate.toISOString().slice(0, 10)}&api_key=${process.env.NASA_API_KEY || "DEMO_KEY"}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`NASA DONKI returned HTTP ${response.status}`);
      const events = await response.json();
      const event = events.sort((a, b) => String(b.beginTime).localeCompare(String(a.beginTime)))[0];
      if (!event) throw new Error("NASA DONKI returned no solar flare events for the requested period");
      latest = {
        id: event.flrID, classType: event.classType, beginTime: event.beginTime,
        peakTime: event.peakTime, sourceLocation: event.sourceLocation || "Unknown",
        radiationRateMSvDay: flareIntensity(event.classType), link: event.link
      };
      status = { source: "NASA_DONKI", checkedAt: new Date().toISOString(), message: "Latest solar-flare observation loaded from NASA DONKI." };
    } catch (donkiError) {
      try {
        const powerStart = startDate.toISOString().slice(0, 10).replace(/-/g, "");
        const powerEnd = endDate.toISOString().slice(0, 10).replace(/-/g, "");
        const powerUrl = `${POWER_URL}?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=0&latitude=0&start=${powerStart}&end=${powerEnd}&format=JSON`;
        const powerResponse = await fetch(powerUrl);
        if (!powerResponse.ok) throw new Error(`NASA POWER returned HTTP ${powerResponse.status}`);
        const powerData = await powerResponse.json();
        const validReading = Object.entries(powerData.properties?.parameter?.ALLSKY_SFC_SW_DWN || {}).reverse().find(([, value]) => typeof value === "number" && value >= 0);
        if (!validReading) throw new Error("NASA POWER returned no valid solar irradiance value");
        solarContext = { solarIrradianceKWhM2Day: validReading[1], source: "NASA_POWER", measuredDate: validReading[0] };
        status = { source: "NASA_POWER", checkedAt: new Date().toISOString(), message: `NASA DONKI unavailable; NASA POWER solar context loaded. ${donkiError.message}` };
      } catch (powerError) {
        status = {
          source: latest ? "NASA_DONKI_CACHE" : "SYNTHETIC_FALLBACK",
          checkedAt: new Date().toISOString(),
          message: latest ? "NASA services unavailable; using the last cached DONKI event." : `NASA data unavailable; using synthetic demo values. DONKI: ${donkiError.message}; POWER: ${powerError.message}`
        };
      }
    }
    return latest;
  };

  return { refresh, getLatest: () => latest, getSolarContext: () => solarContext, getStatus: () => status };
};
