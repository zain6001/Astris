import { API } from "./api";

export type QueuedReading = Record<string, unknown> & { astronautId: string; timestamp: string };
const KEY = "astris_offline_queue";
export const getQueue = (): QueuedReading[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]") as QueuedReading[]; } catch { return []; } };
export const queueReading = (reading: QueuedReading) => localStorage.setItem(KEY, JSON.stringify([...getQueue(), reading]));
export const flushQueue = async (): Promise<number> => {
  const readings = getQueue(); if (!readings.length) return 0;
  const response = await fetch(`${API}/telemetry/sync-batch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ readings }) });
  if (!response.ok) throw new Error("Unable to synchronize offline readings");
  localStorage.removeItem(KEY); return readings.length;
};
