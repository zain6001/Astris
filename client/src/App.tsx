import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, CloudOff, Radio, RotateCcw, ShieldAlert, Wifi, Zap } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { flushQueue, getQueue, queueReading } from "./services/offlineSync";
import { localTriage } from "./services/localTriage";
import { API } from "./services/api";

type Status = "NOMINAL" | "CAUTION" | "CRITICAL";
type Reading = { timestamp: string; heartRateBpm: number; spO2Percent: number; ambientRadiationMSvDay: number; cabinCO2MmHg: number; sleepHours: number; cognitiveReactionMs: number; dailyResistiveExerciseMin: number; boneDensityRetentionScore: number; moodScore: number; coreTempCelsius: number; };
type Alert = { id: string; category: string; severity: Status; message: string; recommendedProtocolId: string; recordedValue: number; };
type Dashboard = { astronaut: { id: string; fullName: string; role: string; missionDay: number; cumulativeRadiationMSv: number; safeMissionRadiationLimitMSv: number }; overallStatus: Status; riskScores: Record<string, number>; latestReading: Reading; recentReadings: Reading[]; activeAlerts: Alert[]; protocols: Record<string, { title: string; rationale: string; urgency: string; estimatedDurationMin: number; steps: string[] }> };
type SpaceWeather = { status: { source: string; message: string }; event: { classType: string; beginTime: string; sourceLocation: string } | null; solarContext: { solarIrradianceKWhM2Day: number } | null };
const statusClass = (status: Status) => status === "CRITICAL" ? "text-red-400 border-red-500/60" : status === "CAUTION" ? "text-amber-400 border-amber-500/60" : "text-emerald-400 border-emerald-500/60";








export default function App() {
  const [astronautId, setAstronautId] = useState("ASTRO-01");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [queueCount, setQueueCount] = useState(getQueue().length);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean[]>>({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather | null>(null);

  const load = useCallback(async () => {
    if (offline) return;
    try {
      const response = await fetch(`${API}/astronauts/${astronautId}/dashboard`);
      if (!response.ok) throw new Error("Dashboard request failed");
      setDashboard(await response.json() as Dashboard);
      const weatherResponse = await fetch(`${API}/space-weather/latest`);
      if (weatherResponse.ok) setSpaceWeather(await weatherResponse.json() as SpaceWeather);
      setError("");
    } catch {
      setError("Mission server unavailable. Enable blackout mode to continue collecting local readings.");
    } finally {
      setLoading(false);
    }
  }, [astronautId, offline]);
  useEffect(() => { load(); const timer = window.setInterval(load, 4000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => {
    const online = async () => { setOffline(false); try { const count = await flushQueue(); if (count) setNotice(`${count} queued records synchronized`); setQueueCount(getQueue().length); } catch { setNotice("Sync delayed: server unavailable"); } };
    const offlineEvent = () => setOffline(true);
    window.addEventListener("online", online); window.addEventListener("offline", offlineEvent);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offlineEvent); };
  }, []);

  const submitReading = async (reading: Record<string, number>) => {
    const numericPayload = { ...reading, heartRateBpm: 70, spO2Percent: 98, systolicBp: 118, diastolicBp: 74, coreTempCelsius: 36.8, respirationRate: 16, ambientRadiationMSvDay: 0.38, cabinCO2MmHg: 2.4, boneDensityRetentionScore: 96, immuneSymptomScore: 0 };
    const payload = { ...numericPayload, astronautId, timestamp: new Date().toISOString() };
    const warnings = localTriage(numericPayload); if (warnings.length) setNotice(`ON-DEVICE TRIAGE: ${warnings.join(" / ")}`);
    if (offline) { queueReading(payload); setQueueCount(getQueue().length); return; }
    try {
      const response = await fetch(`${API}/telemetry/ingest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Telemetry submission failed");
      await load();
      setNotice("Self-check recorded in mission telemetry.");
    } catch {
      setError("Telemetry submission failed. Enable blackout mode and retry to preserve the reading locally.");
    }
  };
  const simulation = async (mode: string) => {
    try {
      const response = await fetch(`${API}/simulation/${mode === "RESET" ? "reset" : "mode"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: mode === "RESET" ? undefined : JSON.stringify({ mode }) });
      if (!response.ok) throw new Error("Simulation request failed");
      setNotice(`${mode === "RESET" ? "Simulation reset to nominal orbit." : `${mode.replace(/_/g, " ")} scenario injected.`}`);
      await load();
    } catch {
      setError("Simulation control unavailable. Confirm the mission server is running.");
    }
  };
  const data = dashboard?.recentReadings || [];
  const cards = useMemo(() => dashboard ? [
    ["Cardiovascular", `${dashboard.latestReading.heartRateBpm} bpm`, `${dashboard.latestReading.spO2Percent}% SpO2`],
    ["Radiation Budget", `${dashboard.latestReading.ambientRadiationMSvDay} mSv/day`, `${dashboard.astronaut.cumulativeRadiationMSv.toFixed(1)} / 600 mSv`],
    ["Musculoskeletal", `${dashboard.latestReading.dailyResistiveExerciseMin} min ARED`, `${dashboard.latestReading.boneDensityRetentionScore}% retention`],
    ["Behavioral & Cognitive", `${dashboard.latestReading.sleepHours} hrs sleep`, `${dashboard.latestReading.cognitiveReactionMs} ms reaction`],
    ["Immune & Environment", `${dashboard.latestReading.coreTempCelsius} °C`, `${dashboard.latestReading.cabinCO2MmHg} mmHg CO2`]
  ] : [], [dashboard]);
  return <main className="min-h-screen p-4 md:p-6">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
      <div><div className="flex items-center gap-2 text-cyan-300"><Radio size={18}/><strong>ASTRIS</strong><span className="text-xs tracking-widest text-slate-400">// AUTONOMOUS CREW HEALTH & TRIAGE</span></div><div className="mono mt-2 text-xs text-slate-500">MET: DAY {dashboard?.astronaut.missionDay ?? 142} // DEEP SPACE OPERATIONS</div><div className="mt-1 text-[10px] text-slate-500">NASA DATA: {spaceWeather?.status.source || "LOADING"} {spaceWeather?.event ? `// ${spaceWeather.event.classType} FLARE // ${spaceWeather.event.sourceLocation}` : spaceWeather?.solarContext ? `// SOLAR IRRADIANCE ${spaceWeather.solarContext.solarIrradianceKWhM2Day.toFixed(2)} kWh/m²/day` : ""}</div></div>
      <div className="flex items-center gap-3"><select className="rounded border border-slate-700 bg-slate-900 p-2 text-sm" value={astronautId} onChange={(e) => setAstronautId(e.target.value)}><option>ASTRO-01</option><option>ASTRO-02</option></select><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(dashboard?.overallStatus || "NOMINAL")}`}>{dashboard?.overallStatus || "NOMINAL"}</span><button className={`flex items-center gap-2 rounded border px-3 py-2 text-xs ${offline ? "border-amber-500 text-amber-400" : "border-emerald-500 text-emerald-400"}`} onClick={() => setOffline(!offline)}>{offline ? <CloudOff size={15}/> : <Wifi size={15}/>} {offline ? `COMMS BLACKOUT // ${queueCount} QUEUED` : "COMMS LINK ACTIVE"}</button></div>
    </header>
    {loading && <div className="mb-4 rounded border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm text-cyan-300">Acquiring crew telemetry...</div>}
    {error && <div className="mb-4 flex items-center justify-between gap-3 rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300"><span>{error}</span><button className="rounded bg-red-900/50 px-3 py-1" onClick={load}>Retry</button></div>}
    {notice && <div className="mb-4 rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">{notice}</div>}
    <section className="card mb-5 flex flex-wrap items-center gap-2 p-3"><span className="mr-3 text-xs font-bold tracking-widest text-slate-500">MISSION HAZARD SIMULATOR</span>{[["NOMINAL","Nominal Orbit"],["SOLAR_FLARE","Solar Flare Event"],["CARDIO_STRESS","Cardio Arrhythmia"],["CABIN_CO2_SPIKE","Cabin CO2 Spike"],["ISOLATION_FATIGUE","Isolation Fatigue"]].map(([mode, label]) => <button key={mode} onClick={() => simulation(mode)} className="rounded bg-slate-800 px-3 py-2 text-xs hover:bg-cyan-900">{label}</button>)}<button onClick={() => simulation("RESET")} className="ml-auto flex items-center gap-1 rounded bg-slate-800 px-3 py-2 text-xs"><RotateCcw size={14}/> Reset</button></section>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([name, primary, secondary]) => { const score = Math.round((dashboard?.riskScores[name] || 0.08) * 100); return <article className="card p-4" key={name}><div className="mb-3 flex justify-between text-xs text-slate-400"><span>{name}</span><span className="mono text-cyan-300">{score}%</span></div><div className="mb-3 h-1.5 rounded bg-slate-800"><div className={`h-1.5 rounded ${score > 80 ? "bg-red-500" : score > 30 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${score}%` }}/></div><strong className="mono block text-lg">{primary}</strong><span className="text-xs text-slate-500">{secondary}</span></article>; })}</section>
    <section className="mt-5 grid gap-4 xl:grid-cols-3">{[["Cardiovascular Vitals","heartRateBpm","spO2Percent","#22d3ee","#a78bfa"],["Closed Environment & Radiation","ambientRadiationMSvDay","cabinCO2MmHg","#f59e0b","#34d399"],["Neurocognitive & Behavioral","sleepHours","cognitiveReactionMs","#60a5fa","#f472b6"]].map(([title, a, b, colorA, colorB]) => <article className="card h-72 p-4" key={title}><h3 className="mb-2 text-sm font-semibold">{title}</h3><ResponsiveContainer width="100%" height="90%"><LineChart data={data}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).getHours() + ":00"} stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}/><Line type="monotone" dataKey={a} stroke={colorA} dot={false}/><Line type="monotone" dataKey={b} stroke={colorB} dot={false}/></LineChart></ResponsiveContainer></article>)}</section>
    <section className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]"><article className="card p-4"><h2 className="mb-4 flex items-center gap-2 font-semibold"><ShieldAlert size={18} className="text-amber-400"/> Autonomous Triage & Intervention</h2>{dashboard?.activeAlerts.length ? dashboard.activeAlerts.map((alert) => { const protocol = dashboard.protocols[alert.recommendedProtocolId]; const boxes = checked[alert.id] || protocol.steps.map(() => false); return <div key={alert.id} className={`mb-3 rounded border p-3 ${statusClass(alert.severity)}`}><button className="flex w-full items-start gap-2 text-left" onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}><AlertTriangle size={18}/><span><strong>{alert.severity} // {alert.category}</strong><span className="mt-1 block text-sm text-slate-300">{alert.message}</span></span></button>{expanded === alert.id && <div className="mt-3 border-t border-slate-700 pt-3 text-sm text-slate-300"><p>{protocol.rationale} <span className="text-slate-500">({protocol.estimatedDurationMin} min)</span></p>{protocol.steps.map((step, index) => <label className="mt-2 flex gap-2" key={step}><input type="checkbox" checked={boxes[index]} onChange={() => { const next = [...boxes]; next[index] = !next[index]; setChecked({ ...checked, [alert.id]: next }); }}/>{step}</label>)}<button disabled={!boxes.every(Boolean)} onClick={async () => { const response = await fetch(`${API}/alerts/${alert.id}/resolve`, { method: "POST" }); if (!response.ok) setError("Alert could not be resolved."); else await load(); }} className="mt-3 flex items-center gap-2 rounded bg-emerald-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={14}/> Confirm Executed & Resolve</button></div>}</div>; }) : <p className="text-sm text-slate-500">No active alerts. All domains nominal.</p>}</article><div className="space-y-4"><SelfCheck onSubmit={submitReading}/><DemoGuide/></div></section>
  </main>;
}

function SelfCheck({ onSubmit }: { onSubmit: (reading: Record<string, number>) => Promise<void> }) {
  const [sleep, setSleep] = useState(7.2); const [mood, setMood] = useState(4); const [fatigue, setFatigue] = useState(2); const [exercise, setExercise] = useState(60);
  return <article className="card p-4"><h2 className="mb-4 flex items-center gap-2 font-semibold"><Activity size={18} className="text-cyan-300"/> Crew Self-Check</h2>{[["Sleep hours", sleep, setSleep, 0, 10, 0.1],["Mood score", mood, setMood, 1, 5, 1],["Fatigue rating", fatigue, setFatigue, 1, 5, 1],["ARED exercise min", exercise, setExercise, 0, 120, 1]].map(([label, value, setter, min, max, step]) => <label className="mb-4 block text-sm" key={label as string}><div className="mb-1 flex justify-between"><span>{label as string}</span><span className="mono text-cyan-300">{value as number}</span></div><input className="w-full accent-cyan-400" type="range" min={min as number} max={max as number} step={step as number} value={value as number} onChange={(e) => (setter as (v: number) => void)(Number(e.target.value))}/></label>)}<button onClick={() => onSubmit({ sleepHours: sleep, moodScore: mood, fatigueRating: fatigue, dailyResistiveExerciseMin: exercise, cognitiveReactionMs: 265 })} className="w-full rounded bg-cyan-700 px-3 py-2 text-sm font-semibold hover:bg-cyan-600">Submit Self-Assessment</button><PvtTest onComplete={(reaction) => onSubmit({ sleepHours: sleep, moodScore: mood, fatigueRating: fatigue, dailyResistiveExerciseMin: exercise, cognitiveReactionMs: reaction })}/><p className="mt-3 text-xs text-slate-500">Behavioral values are evaluated on-device during blackout and synchronized when comms return.</p></article>;
}

function PvtTest({ onComplete }: { onComplete: (reactionMs: number) => Promise<void> }) {
  const [running, setRunning] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [completedAverage, setCompletedAverage] = useState<number | null>(null);
  const shownAt = useRef(0);
  const timeout = useRef<number | undefined>(undefined);
  const schedule = useCallback((attempt: number, current: number[]) => {
    if (attempt >= 5) {
      const average = Math.round(current.reduce((sum, value) => sum + value, 0) / current.length);
      setRunning(false);
      setTargetVisible(false);
      setCompletedAverage(average);
      void onComplete(average);
      return;
    }
    timeout.current = window.setTimeout(() => {
      shownAt.current = performance.now();
      setTargetVisible(true);
    }, 1500 + Math.random() * 2000);
  }, [onComplete]);
  useEffect(() => () => { if (timeout.current) window.clearTimeout(timeout.current); }, []);
  const start = () => { setResults([]); setCompletedAverage(null); setRunning(true); setTargetVisible(false); schedule(0, []); };
  const clickTarget = () => {
    if (!targetVisible) return;
    const next = [...results, Math.round(performance.now() - shownAt.current)];
    setResults(next); setTargetVisible(false); schedule(next.length, next);
  };
  const resultStatus = completedAverage === null ? null : completedAverage > 480 ? "CRITICAL" : completedAverage > 380 ? "CAUTION" : "NORMAL";
  const resultColor = resultStatus === "CRITICAL" ? "text-red-400" : resultStatus === "CAUTION" ? "text-amber-400" : "text-emerald-400";
  return <div className="mt-4 border-t border-slate-800 pt-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold">30-second PVT mini-test</span><button disabled={running} onClick={start} className="rounded bg-violet-700 px-3 py-2 text-xs disabled:opacity-40">{running ? `Stimulus ${results.length + 1}/5...` : "Start PVT"}</button></div><div className="relative mt-3 flex h-16 items-center justify-center rounded bg-slate-950 text-xs text-slate-500">{running ? <button aria-label="Click the stimulus" onClick={clickTarget} className={`h-10 w-10 rounded-full ${targetVisible ? "bg-red-500 shadow-lg shadow-red-500/50" : "bg-slate-800"}`}>{targetVisible ? "" : "WAIT"}</button> : completedAverage !== null ? <span className={`mono font-semibold ${resultColor}`}>Average reaction: {completedAverage} ms // {resultStatus}</span> : "Press Start PVT, then click the red target as soon as it appears."}</div>{completedAverage !== null && <p className={`mt-2 text-xs ${resultColor}`}>{resultStatus === "NORMAL" ? "Reaction time is within the nominal demonstration range." : resultStatus === "CAUTION" ? "Caution: slower reaction time detected; consider rest and repeat the test." : "Critical: significantly delayed reaction time detected; follow the behavioral intervention protocol."}</p>}</div>;
}

function DemoGuide() {
  return <article className="card p-4"><h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Zap size={16} className="text-amber-400"/> Judge Demo Playbook</h2><ol className="list-decimal space-y-1 pl-5 text-xs text-slate-400"><li>Start in Nominal Orbit and show live charts.</li><li>Inject Solar Flare or Cardio Arrhythmia.</li><li>Open the alert protocol and check every step.</li><li>Resolve it, then toggle Comms Blackout.</li><li>Run the PVT and submit the offline reading.</li></ol></article>;
}
