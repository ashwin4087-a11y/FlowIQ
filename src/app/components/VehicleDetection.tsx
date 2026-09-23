import { useMemo, useState } from 'react';
import { Car, Truck, Bike, Bus, Ambulance } from 'lucide-react';

type DetectionType = 'ambulance' | 'bus' | 'car' | 'motorcycle' | 'truck' | 'unknown';

interface DetectionBox {
  classId: number;
  label: DetectionType;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DatasetSample {
  id: string;
  url: string;
  boxes: DetectionBox[];
}

const classLabels: Record<number, DetectionType> = {
  0: 'ambulance',
  1: 'bus',
  2: 'car',
  3: 'motorcycle',
  4: 'truck',
};

const imageModules = import.meta.glob('../VehiclesDetectionDataset/valid/images/*.{jpg,jpeg,png}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const labelModules = import.meta.glob('../VehiclesDetectionDataset/valid/labels/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const parseLabelText = (raw: string): DetectionBox[] =>
  raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [classIdRaw, xRaw, yRaw, wRaw, hRaw] = line.split(' ');
      const classId = Number(classIdRaw);
      return {
        classId,
        label: classLabels[classId] ?? 'unknown',
        x: Number(xRaw) * 100,
        y: Number(yRaw) * 100,
        width: Number(wRaw) * 100,
        height: Number(hRaw) * 100,
      };
    });

const buildSamples = (): DatasetSample[] => {
  const sampleEntries = Object.entries(imageModules)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .slice(0, 10);

  return sampleEntries.map(([path, url]) => {
    const fileName = path.split('/').pop()?.replace(/\.(jpg|jpeg|png)$/i, '') ?? path;
    const labelKey = Object.keys(labelModules).find((key) => key.includes(fileName));
    const rawLabels = labelKey ? labelModules[labelKey] : '';
    return {
      id: fileName,
      url,
      boxes: rawLabels ? parseLabelText(rawLabels) : [],
    };
  });
};

const typeIcon = (type: DetectionType) => {
  switch (type) {
    case 'truck':
      return Truck;
    case 'motorcycle':
      return Bike;
    case 'bus':
      return Bus;
    case 'ambulance':
      return Ambulance;
    default:
      return Car;
  }
};

export function VehicleDetection() {
  const samples = useMemo(buildSamples, []);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (samples.length === 0) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
        <h3 className="text-lg mb-4">Vehicle Detection</h3>
        <p className="text-[#8B949E]">No dataset preview images could be loaded from src/app/VehiclesDetectionDataset.</p>
      </div>
    );
  }

  const sample = samples[currentIndex];
  const summary = sample.boxes.reduce<Record<DetectionType, number>>((acc, box) => {
    acc[box.label] = (acc[box.label] || 0) + 1;
    return acc;
  }, {} as Record<DetectionType, number>);

  const totalDetections = sample.boxes.length;
  const topType = Object.entries(summary).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
  const Icon = typeIcon(topType as DetectionType);

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % samples.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + samples.length) % samples.length);

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg">Vehicle Detection</h3>
          <p className="text-[#8B949E] text-sm">Kaggle dataset sample with YOLO-style detection labels</p>
        </div>
        <div className="rounded-full bg-[#0D1117] px-3 py-1 text-xs text-[#39D5B0]">Dataset Preview</div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[#30363D] bg-[#0D1117]">
        <img src={sample.url} alt={`Detection sample ${currentIndex + 1}`} className="w-full h-80 object-cover" />
        {sample.boxes.map((box, index) => (
          <div
            key={`${sample.id}-${index}`}
            className="absolute border border-[#39D5B0]/80 rounded-md overflow-hidden"
            style={{
              left: `${Math.max(0, Math.min(100, box.x - box.width / 2))}%`,
              top: `${Math.max(0, Math.min(100, box.y - box.height / 2))}%`,
              width: `${Math.max(2, Math.min(100, box.width))}%`,
              height: `${Math.max(2, Math.min(100, box.height))}%`,
            }}
          >
            <div className="bg-[#0D1117]/90 px-1 text-[11px] uppercase tracking-[0.18em] text-[#39D5B0]">
              {box.label}
            </div>
          </div>
        ))}
        <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
          Sample {currentIndex + 1} / {samples.length}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3">
          <p className="text-[#8B949E] text-xs">Total Detections</p>
          <p className="text-2xl font-semibold">{totalDetections}</p>
        </div>
        <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3 flex items-center gap-2">
          <Icon size={18} className="text-[#39D5B0]" />
          <div>
            <p className="text-[#8B949E] text-xs">Primary Vehicle Type</p>
            <p className="text-white uppercase text-sm">{topType}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={prevImage}
          className="flex-1 px-4 py-2 bg-[#30363D] hover:bg-[#404040] rounded-lg transition-colors"
          disabled={samples.length <= 1}
        >
          Previous
        </button>
        <button
          onClick={nextImage}
          className="flex-1 px-4 py-2 bg-[#30363D] hover:bg-[#404040] rounded-lg transition-colors"
          disabled={samples.length <= 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}