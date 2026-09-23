import { MapPin } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  forwardGeocodeSuggestions,
  type PlaceSuggestion,
  ROUTE_PLANNER_MAP_PROXIMITY,
} from '../../lib/maptiler/geocoding';
import type { LatLng } from '../../types/routePlanner';

const DEBOUNCE_MS = 350;

export function PlaceAutocomplete({
  label,
  placeholder,
  selected,
  onSelectedChange,
  proximity = ROUTE_PLANNER_MAP_PROXIMITY,
  disabled,
  seedQuery,
}: {
  label: string;
  placeholder: string;
  selected: LatLng | null;
  onSelectedChange: (place: LatLng | null) => void;
  proximity?: [number, number];
  disabled?: boolean;
  /** Prefill input and fetch suggestions (does not auto-select). */
  seedQuery?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestGen = useRef(0);
  const lastSeedRef = useRef<string | undefined>();

  const isConfirmed = Boolean(
    selected && selected.label === query.trim() && Number.isFinite(selected.lng),
  );

  useEffect(() => {
    if (selected?.label) setQuery(selected.label);
  }, [selected?.lng, selected?.lat, selected?.label]);

  const runSearch = useCallback(
    async (text: string) => {
      const gen = ++requestGen.current;
      if (!text.trim()) {
        setSuggestions([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const hits = await forwardGeocodeSuggestions(text, { proximity, limit: 5 });
        if (gen !== requestGen.current) return;
        setSuggestions(hits);
        setHighlight(-1);
        if (hits.length === 0) setError('No places found — try a more specific name.');
      } catch {
        if (gen !== requestGen.current) return;
        setSuggestions([]);
        setError('Geocoding unavailable. Check your MapTiler key and network.');
      } finally {
        if (gen === requestGen.current) setLoading(false);
      }
    },
    [proximity],
  );

  useEffect(() => {
    if (!seedQuery?.trim()) {
      lastSeedRef.current = undefined;
      return;
    }
    if (seedQuery === lastSeedRef.current) return;
    lastSeedRef.current = seedQuery;
    setQuery(seedQuery);
    onSelectedChange(null);
    setOpen(true);
    runSearch(seedQuery);
  }, [seedQuery, runSearch, onSelectedChange]);

  const onInputChange = (value: string) => {
    setQuery(value);
    onSelectedChange(null);
    setOpen(true);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), DEBOUNCE_MS);
  };

  const pick = (s: PlaceSuggestion) => {
    const place: LatLng = {
      lng: s.lng,
      lat: s.lat,
      label: s.placeName,
    };
    setQuery(s.placeName);
    onSelectedChange(place);
    setSuggestions([]);
    setOpen(false);
    setHighlight(-1);
    setError(null);
  };

  const onKeyDown = (e: { key: string; preventDefault: () => void }) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      if (!suggestions.length && query.trim()) runSearch(query);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
      return;
    }
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === 'Enter' && highlight >= 0 && highlight < suggestions.length) {
      e.preventDefault();
      pick(suggestions[highlight]);
    }
  };

  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      if (!rootRef.current?.contains(ev.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const showList = open && (loading || error || suggestions.length > 0);

  return (
    <div ref={rootRef} className="relative">
      <label className="text-xs text-[#94A3B8]">{label}</label>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        className={`mt-1 w-full bg-[#0F172A] border rounded px-2 py-2 text-sm pr-8 ${
          isConfirmed
            ? 'border-[#10B981] text-[#E2E8F0]'
            : 'border-[#334155] text-[#F8FAFC]'
        }`}
        value={query}
        placeholder={placeholder}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {isConfirmed && (
        <MapPin
          className="absolute right-2 top-[calc(50%+0.35rem)] -translate-y-1/2 w-4 h-4 text-[#10B981]"
          aria-hidden
        />
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-auto rounded border border-[#334155] bg-[#0F172A] shadow-lg text-xs"
        >
          {loading && (
            <li className="px-3 py-2 text-[#94A3B8]">Searching…</li>
          )}
          {!loading && error && (
            <li className="px-3 py-2 text-[#F59E0B]">{error}</li>
          )}
          {!loading &&
            !error &&
            suggestions.map((s, i) => (
              <li key={s.id} role="option" aria-selected={highlight === i}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 flex gap-2 items-start ${
                    highlight === i ? 'bg-[#1E293B]' : 'hover:bg-[#1E293B]/80'
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(s)}
                >
                  <MapPin className="w-4 h-4 shrink-0 text-[#0EA5E9] mt-0.5" aria-hidden />
                  <span>
                    <span className="block text-[#F1F5F9] font-medium">{s.primary}</span>
                    {s.secondary && (
                      <span className="block text-[#94A3B8] text-[11px] mt-0.5">{s.secondary}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
      {isConfirmed && (
        <p className="text-[10px] text-[#10B981] mt-1">Location confirmed — coordinates locked for routing.</p>
      )}
      {!isConfirmed && query.trim() && !open && !loading && (
        <p className="text-[10px] text-[#64748b] mt-1">Select a suggestion to set this stop.</p>
      )}
    </div>
  );
}
