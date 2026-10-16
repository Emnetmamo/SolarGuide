import { FALLBACK_PSH } from "@/lib/solar";

const ENDPOINT = "https://power.larc.nasa.gov/api/temporal/climatology/point";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export const NASA_ATTRIBUTION =
  "NASA POWER — Prediction Of Worldwide Energy Resources (power.larc.nasa.gov), ALLSKY_SFC_SW_DWN climatology, kW-hr/m²/day.";

/**
 * Location-specific monthly peak sun hours.
 * Verified response shape: properties.parameter.ALLSKY_SFC_SW_DWN = { JAN…DEC, ANN }, units kW-hr/m²/day.
 * On any failure the built-in fallback table is used and the caller must show the estimate notice.
 */
export async function fetchSolarResource({ latitude, longitude }) {
  const stamp = new Date().toISOString();
  try {
    const url = `${ENDPOINT}?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${encodeURIComponent(longitude)}&latitude=${encodeURIComponent(latitude)}&format=JSON`;
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(9000) });
    if (!res.ok) throw new Error(`NASA POWER replied ${res.status}`);
    const json = await res.json();
    const block = json?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
    const monthly = MONTHS.map((m) => Number(block?.[m]));
    if (monthly.some((v) => !Number.isFinite(v) || v <= 0)) throw new Error("NASA POWER response was incomplete");
    return {
      monthly,
      source: `NASA POWER climatology (2001–2025), ${latitude}, ${longitude}`,
      timestamp: stamp,
      fallback: false,
    };
  } catch (error) {
    return {
      monthly: FALLBACK_PSH,
      source: "Built-in fallback table (solar resource API unavailable)",
      timestamp: stamp,
      fallback: true,
      detail: String(error?.message ?? error),
    };
  }
}