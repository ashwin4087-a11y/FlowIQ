import type { PlannedRoute } from '../types/routePlanner';

export function shortPlaceLabel(label?: string): string {
  if (!label) return '';
  const first = label.split(',')[0]?.trim();
  return first || label;
}

/** Summarize OSRM step names (3–6 meaningful segments). */
export function summarizeDirectionSteps(steps: string[] | undefined, max = 5): string[] {
  if (!steps?.length) return [];
  const out: string[] = [];
  for (const raw of steps) {
    const name = raw.trim();
    if (!name) continue;
    if (out[out.length - 1] === name) continue;
    out.push(name);
  }
  if (out.length <= max) return out;
  const head = out.slice(0, Math.max(2, max - 1));
  const tail = out[out.length - 1];
  return [...head, tail];
}

export function routeDirectionLines(
  fromLabel: string,
  toLabel: string,
  route: PlannedRoute,
): string[] {
  const from = shortPlaceLabel(fromLabel) || 'Origin';
  const to = shortPlaceLabel(toLabel) || 'Destination';
  const mids = summarizeDirectionSteps(route.directionSteps);
  if (mids.length === 0) return [from, to];
  return [from, ...mids, to];
}
