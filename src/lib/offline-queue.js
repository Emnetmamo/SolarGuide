// Reads typed while offline wait here (on this device) until a connection returns.
const KEY = "solarguide:pending-readings";

export function readQueue() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(rows) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* storage full or blocked — the reading stays only in this session */
  }
}

export function enqueue(row) {
  const queue = readQueue();
  queue.push(row);
  writeQueue(queue);
  return queue.length;
}

export function pendingCount() {
  return readQueue().length;
}

/** Sends every queued reading, de-duplicated by project + date. Returns how many went out. */
export async function flushQueue(send, projectId) {
  const queue = readQueue();
  const mine = queue.filter((r) => !projectId || r.projectId === projectId);
  if (!mine.length) return 0;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return 0;
  const byProject = new Map();
  mine.forEach((r) => {
    const list = byProject.get(r.projectId) ?? [];
    list.push({ date: r.date, energy_kwh: r.energy_kwh, irradiance: r.irradiance ?? null, source: "manual" });
    byProject.set(r.projectId, list);
  });
  let sent = 0;
  for (const [id, rows] of byProject.entries()) {
    await send({ projectId: id, rows });
    sent += rows.length;
  }
  writeQueue(queue.filter((r) => !mine.includes(r)));
  return sent;
}