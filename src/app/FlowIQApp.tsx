import { lazy, Suspense, useState } from 'react';
import { TrafficLightLogo } from './components/TrafficLightLogo';
import FlowIQDashboard from './FlowIQDashboard';
import { SurgePredictionPage } from './SurgePredictionPage';
import { RoutePlannerErrorBoundary } from '../components/RoutePlannerErrorBoundary';
import { useFlowIQRuntime } from '../hooks/useFlowIQRuntime';

const RoutePlannerPage = lazy(() =>
  import('./RoutePlannerPage').then((m) => ({ default: m.RoutePlannerPage })),
);

type AppView = 'overview' | 'surge-prediction' | 'route-planner';

export default function FlowIQApp() {
  const [view, setView] = useState<AppView>('overview');
  const runtime = useFlowIQRuntime();

  const nav: { id: AppView; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'surge-prediction', label: 'SURGE PREDICTION' },
    { id: 'route-planner', label: 'ROUTE PLANNER' },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <header className="border-b border-[#334155] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrafficLightLogo />
          <div>
            <h1 className="text-xl font-semibold">FlowIQ</h1>
            <p className="text-xs text-[#94A3B8]">Adaptive Urban Traffic Intelligence</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {nav.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`text-xs px-4 py-2 rounded font-semibold transition-colors ${
                view === id
                  ? 'bg-[#0EA5E9]/15 text-[#0EA5E9] ring-1 ring-[#0EA5E9]/40'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {view === 'overview' && (
        <FlowIQDashboard shell="content" runtime={runtime} onOpenSurge={() => setView('surge-prediction')} />
      )}
      {view === 'surge-prediction' && <SurgePredictionPage runtime={runtime} />}
      {view === 'route-planner' && (
        <div className="overflow-hidden">
          <RoutePlannerErrorBoundary>
            <Suspense
              fallback={<div className="p-6 text-[#94A3B8] text-sm">Loading Route Planner…</div>}
            >
              <RoutePlannerPage />
            </Suspense>
          </RoutePlannerErrorBoundary>
        </div>
      )}
    </div>
  );
}
