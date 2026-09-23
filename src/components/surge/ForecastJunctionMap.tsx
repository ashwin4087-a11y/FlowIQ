import { CHENNAI_JUNCTIONS } from '../../data/chennaiJunctions';

export function ForecastJunctionMap({
  selectedId,
  level,
  onSelect,
}: {
  selectedId: string;
  level?: string | null;
  onSelect: (id: string) => void;
}) {
  const maxLat = Math.max(...CHENNAI_JUNCTIONS.map((j) => j.lat));
  const maxLng = Math.max(...CHENNAI_JUNCTIONS.map((j) => j.lng));

  return (
    <div
      className="relative h-32 rounded border border-[#334155] bg-[#0F172A] overflow-hidden"
      role="listbox"
      aria-label="Chennai junction map (schematic)"
    >
      <p className="absolute top-1 left-2 text-[9px] text-[#64748b] z-10">Chennai network (schematic)</p>
      {CHENNAI_JUNCTIONS.map((j) => {
        const x = (j.lng / maxLng) * 88 + 6;
        const y = (j.lat / maxLat) * 78 + 14;
        const selected = j.id === selectedId;
        const ring =
          selected && level === 'HIGH'
            ? 'ring-2 ring-[#EF4444]/60'
            : selected
              ? 'ring-2 ring-[#0EA5E9]'
              : '';
        return (
          <button
            key={j.id}
            type="button"
            role="option"
            aria-selected={selected}
            className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-[#475569] hover:bg-[#0EA5E9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] transition-colors ${ring}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            title={j.name}
            onClick={() => onSelect(j.id)}
          />
        );
      })}
    </div>
  );
}
