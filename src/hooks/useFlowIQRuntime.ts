import { useCallback, useEffect, useState } from 'react';
import type { FlowIQState } from '../types/flowiq';
import { fetchHealth, fetchState } from '../lib/api';
import { getSocket, subscribeState } from '../lib/socket';

const OFFLINE_DEFAULT: FlowIQState = {
  junctionId: 'chennai-prototype-1',
  junctionName: 'Anna Nagar Junction',
  updatedAt: new Date().toISOString(),
  controlMode: 'HEURISTIC',
  trafficMode: 'NORMAL',
  traffic: {
    timestamp: new Date().toISOString(),
    junctionId: 'chennai-prototype-1',
    lanes: [],
    vehicleCount: 0,
    queueLength: 0,
    averageSpeedKmh: 0,
    congestionLevel: 'low',
    source: 'simulation',
    simulated: true,
  },
  signals: {
    junctionId: 'chennai-prototype-1',
    phases: {
      NORTH_SOUTH_GREEN: { durationSec: 45 },
      NORTH_SOUTH_YELLOW: { durationSec: 4 },
      ALL_RED: { durationSec: 2 },
      EAST_WEST_GREEN: { durationSec: 40 },
      EAST_WEST_YELLOW: { durationSec: 4 },
    },
    activePhase: 'EAST_WEST_GREEN',
    remainingSeconds: 30,
    mode: 'HEURISTIC',
    source: 'simulation',
    simulated: true,
  },
  prediction: {
    congestionProbability: null,
    surgeLevel: 'LOW',
    confidence: null,
    source: 'unavailable',
    timestamp: new Date().toISOString(),
    simulated: false,
    note: 'Connect backend for short-horizon surge model',
  },
  emergency: {
    active: false,
    type: null,
    source: null,
    confidence: 0,
    location: 'Anna Nagar Junction',
    direction: null,
    timestamp: null,
    simulated: false,
  },
  audio: {
    modelLoaded: false,
    modelVersion: null,
    lastEvent: null,
    temporal: { status: 'NORMAL', consecutiveHigh: 0, recentProbabilities: [] },
  },
  system: {
    frontend: 'online',
    backend: 'offline',
    audioModel: 'not_loaded',
    vision: 'demo',
    rlController: 'not_loaded',
    sumo: 'not_connected',
    mqtt: 'not_connected',
    mongodb: 'optional_offline',
  },
  vehicles: [],
};

export function useFlowIQRuntime() {
  const [state, setState] = useState<FlowIQState>(OFFLINE_DEFAULT);
  const [backendOnline, setBackendOnline] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const refreshState = useCallback(async () => {
    try {
      await fetchHealth();
      setBackendOnline(true);
      const s = await fetchState();
      setState(s);
      return true;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    refreshState();
    const interval = window.setInterval(() => {
      if (!backendOnline) refreshState();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [backendOnline, refreshState]);

  useEffect(() => {
    const sock = getSocket();
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onConnectError = () => setSocketConnected(false);
    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('connect_error', onConnectError);
    if (sock.connected) setSocketConnected(true);

    const unsub = subscribeState((s) => {
      setState(s);
      setBackendOnline(true);
    });
    return () => {
      unsub();
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('connect_error', onConnectError);
    };
  }, []);

  return {
    state,
    setState,
    backendOnline,
    socketConnected,
    refreshState,
  };
}

export type FlowIQRuntime = ReturnType<typeof useFlowIQRuntime>;
