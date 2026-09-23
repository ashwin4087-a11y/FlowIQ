export function getMapTilerApiKey(): string | undefined {
  const key = import.meta.env.VITE_MAPTILER_API_KEY?.trim();
  return key || undefined;
}

/** Sync check only — does not load the MapTiler SDK module. */
export function ensureMapTilerConfigured(): boolean {
  return Boolean(getMapTilerApiKey());
}

/** Sets MapTiler client config after lazy-loading the SDK (Route Planner only). */
export async function applyMapTilerApiKey(): Promise<boolean> {
  const key = getMapTilerApiKey();
  if (!key) return false;
  const { config } = await import('@maptiler/sdk');
  config.apiKey = key;
  return true;
}

/** Preflight: ensure the key can load the Streets style (tiles will fail otherwise). */
export async function verifyMapTilerMapAccess(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const key = getMapTilerApiKey();
  if (!key) {
    return { ok: false, message: 'MapTiler API key required (VITE_MAPTILER_API_KEY).' };
  }
  const sdk = await import('@maptiler/sdk');
  sdk.config.apiKey = key;
  const styleId = sdk.MapStyle.STREETS.variants.DEFAULT.id;
  const styleUrl = `https://api.maptiler.com/maps/${styleId}/style.json?key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(styleUrl);
    if (!res.ok) {
      const detail = (await res.text()).trim().slice(0, 240);
      return {
        ok: false,
        message: `MapTiler basemap blocked (HTTP ${res.status}). ${detail || 'Check key restrictions at cloud.maptiler.com.'}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'MapTiler style request failed',
    };
  }
}
