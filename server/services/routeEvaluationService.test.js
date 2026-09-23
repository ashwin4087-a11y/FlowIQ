import assert from 'node:assert/strict';
import { evaluateRoutes, simulatedCongestionFromGeometry } from './routeEvaluationService.js';

const geometry = {
  type: 'LineString',
  coordinates: [
    [80.28, 13.08],
    [80.27, 13.081],
    [80.26, 13.082],
    [80.21, 13.088],
  ],
};

const routes = [
  {
    id: 'route-0',
    durationSeconds: 720,
    distanceMeters: 6400,
    geometry,
    coordinateCount: 4,
  },
  {
    id: 'route-1',
    durationSeconds: 840,
    distanceMeters: 6800,
    geometry: {
      type: 'LineString',
      coordinates: [
        [80.28, 13.08],
        [80.29, 13.09],
        [80.21, 13.088],
      ],
    },
    coordinateCount: 3,
  },
];

const state = {
  traffic: { queueLength: 12 },
  prediction: { surgeLevel: 'HIGH', source: 'surge_model' },
};

const result = evaluateRoutes(routes, state);
assert.equal(result.routes.length, 2);
assert.ok(result.recommendedRouteId);
assert.ok(result.scoringFormula.includes('flowiqAdjustedDuration'));

const sim = simulatedCongestionFromGeometry(geometry, 0);
assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(sim.level));

console.log('routeEvaluationService.test.js: passed');
console.log('recommended:', result.recommendedRouteId, 'fastest:', result.fastestRouteId);
