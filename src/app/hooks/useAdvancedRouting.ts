import { useState, useCallback, useMemo } from 'react';

export interface RouteMetrics {
  id: string;
  distance: number;
  time: number;
  timeSaved: number;
  surge: number; // 0-100 scale
  traffic: number; // 0-100 scale
  efficiency: number; // 0-100 scale
  emissions: number; // 0-100 scale (lower is better)
}

export interface Route {
  id: string;
  name: string;
  type: 'fastest' | 'balanced' | 'scenic' | 'express';
  origin: [number, number];
  destination: [number, number];
  waypoints: Array<[number, number]>;
  metrics: RouteMetrics;
  characteristics: string[];
  color: string;
  via: string;
  tags: string[];
}

export interface RouteComparison {
  bestTime: number;
  bestDistance: number;
  averageSurge: number;
  mostEfficient: Route;
}

// Algorithm to generate alternate routes with variations
function generateAlternateRoute(
  origin: [number, number],
  destination: [number, number],
  type: 'fastest' | 'balanced' | 'scenic' | 'express',
  index: number
): Array<[number, number]> {
  const points: Array<[number, number]> = [origin];
  const dx = destination[0] - origin[0];
  const dy = destination[1] - origin[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(10, Math.floor(distance * 120));

  // Type-specific deviation patterns
  const getDeviation = (t: number): number => {
    const modifier = {
      fastest: 0.004 + Math.random() * 0.002,
      balanced: 0.006 + Math.random() * 0.003,
      scenic: 0.008 + Math.random() * 0.004,
      express: 0.003 + Math.random() * 0.001,
    };
    return modifier[type] + index * 0.001;
  };

  const perpX = (-dy / distance) * getDeviation(0.5);
  const perpY = (dx / distance) * getDeviation(0.5);

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const jitter = Math.sin(t * Math.PI * (2 + index)) * getDeviation(t);

    points.push([
      origin[0] + dx * t + perpX * Math.sin(t * Math.PI) + jitter * (Math.random() - 0.5),
      origin[1] + dy * t + perpY * Math.sin(t * Math.PI) + jitter * (Math.random() - 0.5),
    ]);
  }

  points.push(destination);
  return points;
}

// Calculate route metrics based on characteristics
function calculateMetrics(
  type: 'fastest' | 'balanced' | 'scenic' | 'express',
  distance: number,
  index: number
): RouteMetrics {
  const baseTime = distance * 2.5; // ~2.5 min per km baseline

  const metrics: Record<string, RouteMetrics> = {
    fastest: {
      id: 'primary',
      distance: distance * 1.02,
      time: baseTime * 0.95,
      timeSaved: Math.round(baseTime * 0.3),
      surge: 25 + Math.random() * 20,
      traffic: 30 + Math.random() * 20,
      efficiency: 85 + Math.random() * 10,
      emissions: 60 + Math.random() * 15,
    },
    balanced: {
      id: 'alt1',
      distance: distance * 1.08,
      time: baseTime * 1.05,
      timeSaved: Math.round(baseTime * 0.2),
      surge: 15 + Math.random() * 10,
      traffic: 20 + Math.random() * 15,
      efficiency: 80 + Math.random() * 15,
      emissions: 45 + Math.random() * 15,
    },
    scenic: {
      id: 'alt2',
      distance: distance * 1.15,
      time: baseTime * 1.15,
      timeSaved: Math.round(baseTime * 0.1),
      surge: 5 + Math.random() * 10,
      traffic: 10 + Math.random() * 10,
      efficiency: 70 + Math.random() * 15,
      emissions: 30 + Math.random() * 15,
    },
    express: {
      id: 'alt3',
      distance: distance * 0.95,
      time: baseTime * 0.85,
      timeSaved: Math.round(baseTime * 0.35),
      surge: 40 + Math.random() * 20,
      traffic: 50 + Math.random() * 15,
      efficiency: 88 + Math.random() * 10,
      emissions: 75 + Math.random() * 15,
    },
  };

  return metrics[type];
}

export function useAdvancedRouting(origin: [number, number], destination: [number, number]) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const generateRoutes = useCallback(async () => {
    setLoading(true);

    // Simulate route computation delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const types: Array<'fastest' | 'balanced' | 'scenic' | 'express'> = [
      'fastest',
      'balanced',
      'scenic',
      'express',
    ];
    const baseDistance = Math.sqrt(
      Math.pow(destination[0] - origin[0], 2) + Math.pow(destination[1] - origin[1], 2)
    ) * 111; // Convert degrees to km

    const newRoutes: Route[] = types.map((type, idx) => {
      const waypoints = generateAlternateRoute(origin, destination, type, idx);
      const metrics = calculateMetrics(type, baseDistance, idx);

      const routeConfig: Record<string, any> = {
        fastest: {
          name: 'Primary Route (Recommended)',
          color: '#00ff88',
          via: 'Main arterial, bypass enabled',
          characteristics: ['Signal-free', 'Highway access', 'Real-time AI optimization'],
          tags: ['Surge-free', 'Fast-track', 'Recommended'],
        },
        balanced: {
          name: 'Alternate Route A',
          color: '#00e5ff',
          via: 'Residential corridor',
          characteristics: ['Smooth flow', 'Scenic path', 'Low congestion'],
          tags: ['Smooth', 'Scenic', 'Signal-free'],
        },
        scenic: {
          name: 'Alternate Route B',
          color: '#fbbf24',
          via: 'Park route, no trucks',
          characteristics: ['Green corridor', 'Minimal emissions', 'Pedestrian-friendly'],
          tags: ['Quieter', 'Less traffic', 'Green zone'],
        },
        express: {
          name: 'Alternate Route C',
          color: '#f97316',
          via: 'Highway express',
          characteristics: ['Express lane', 'Toll route', 'Maximum speed'],
          tags: ['Highway', 'Fastest', 'Premium'],
        },
      };

      return {
        id: type,
        name: routeConfig[type].name,
        type,
        origin,
        destination,
        waypoints,
        metrics,
        characteristics: routeConfig[type].characteristics,
        color: routeConfig[type].color,
        via: routeConfig[type].via,
        tags: routeConfig[type].tags,
      };
    });

    setRoutes(newRoutes);
    setSelectedRoute(newRoutes[0]);
    setLoading(false);
  }, [origin, destination]);

  const comparison: RouteComparison = useMemo(() => {
    if (routes.length === 0) {
      return {
        bestTime: 0,
        bestDistance: 0,
        averageSurge: 0,
        mostEfficient: {} as Route,
      };
    }

    const bestTime = Math.min(...routes.map((r) => r.metrics.time));
    const bestDistance = Math.min(...routes.map((r) => r.metrics.distance));
    const averageSurge =
      routes.reduce((sum, r) => sum + r.metrics.surge, 0) / routes.length;
    const mostEfficient = routes.reduce((best, current) =>
      current.metrics.efficiency > best.metrics.efficiency ? current : best
    );

    return {
      bestTime: Math.round(bestTime),
      bestDistance: Number(bestDistance.toFixed(1)),
      averageSurge: Math.round(averageSurge),
      mostEfficient,
    };
  }, [routes]);

  return {
    routes,
    loading,
    selectedRoute,
    comparison,
    setSelectedRoute,
    generateRoutes,
  };
}

// Hook for route zone management
export function useRouteZones() {
  const zones = {
    'ashok-nagar': {
      name: 'Ashok Nagar',
      coords: [13.0468, 80.2152] as [number, number],
      characteristics: ['Urban Corridor', 'Signal-heavy', 'Peak-time congestion'],
      peakHours: '08:00-10:00, 17:00-19:00',
    },
    'guindy': {
      name: 'Guindy',
      coords: [13.0067, 80.2206] as [number, number],
      characteristics: ['Eastern Bypass', 'Park Route', 'Low surge'],
      peakHours: '07:30-09:30, 18:00-20:00',
    },
    'kodambakkam': {
      name: 'Kodambakkam',
      coords: [13.0501, 80.2123] as [number, number],
      characteristics: ['Central Junction', 'Mixed Traffic', 'Industrial'],
      peakHours: '08:30-10:30, 17:30-19:30',
    },
    'nungambakkam': {
      name: 'Nungambakkam',
      coords: [13.0569, 80.2425] as [number, number],
      characteristics: ['Northern Corridor', 'High Volume', 'Multiple exits'],
      peakHours: '07:00-09:00, 17:00-19:30',
    },
    'vadapalani': {
      name: 'Vadapalani',
      coords: [13.0501, 80.2123] as [number, number],
      characteristics: ['Western Bypass', 'Residential', 'Free-flow'],
      peakHours: '08:00-10:00, 17:30-19:30',
    },
    'anna-nagar': {
      name: 'Anna Nagar',
      coords: [13.0850, 80.2101] as [number, number],
      characteristics: ['Northern Zone', 'Main Roads', 'Moderate'],
      peakHours: '08:00-10:00, 17:00-19:00',
    },
    'koyambedu': {
      name: 'Koyambedu',
      coords: [13.0694, 80.1946] as [number, number],
      characteristics: ['Western Junction', 'Market Area', 'Peak surge'],
      peakHours: '08:00-10:00, 17:30-19:30',
    },
    'ambattur': {
      name: 'Ambattur',
      coords: [13.1143, 80.1548] as [number, number],
      characteristics: ['Industrial Zone', 'Truck route', 'Less congested'],
      peakHours: '07:00-09:00, 17:00-18:30',
    },
  };

  return zones;
}
