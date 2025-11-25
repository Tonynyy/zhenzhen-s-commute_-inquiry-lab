import { Connection, NodeData, SimulationResult } from './types';

export const parseTime = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const formatTime = (minutes: number): string => {
  let h = Math.floor(minutes / 60);
  let m = Math.floor(minutes % 60);
  if (h >= 24) h -= 24;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

// The Simulation Engine
export const runSimulation = (
  nodes: NodeData[], 
  connections: Connection[], 
  runCount: number,
  levelId: number
): SimulationResult[] => {
  const results: SimulationResult[] = [];

  // Helper to get node value safely
  const getNode = (id: string) => nodes.find(n => n.id === id);
  const getInputValue = (id: string) => {
    const n = getNode(id);
    return n ? n.value : 0;
  };
  
  // Check connections
  const isConnected = (source: string, target: string) => 
    connections.some(c => c.source === source && c.target === target);

  for (let i = 0; i < runCount; i++) {
    // Track if we need to update the UI based on internal physics (e.g., auto-setting congestion)
    const nodeUpdates: Record<string, any> = {};

    // 1. Get Base Variables
    const departureStr = getInputValue('departure') as string;
    let departureTime = parseTime(departureStr);
    
    let distance = Number(getInputValue('distance'));
    let baseSpeed = Number(getInputValue('speed'));
    const lightsDuration = Number(getInputValue('lights'));
    
    // Congestion Logic (Level 5)
    let congestion = getInputValue('congestion') as string;

    // 2. Apply Modifiers
    // Note: Weather calculation is now MANUAL by user in Level 4/5. 
    // We rely on the `baseSpeed` input being set correctly (e.g. 16 instead of 20).
    
    let actualSpeed = baseSpeed;

    // 3. Calculate Travel Time
    let travelMinutes = 0;

    // Basic Travel (Distance / Speed)
    if (isConnected('distance', 'travelTime') && isConnected('speed', 'travelTime')) {
       if (actualSpeed > 0) {
         travelMinutes += (distance / actualSpeed) * 60;
       }
    }

    // Traffic Lights (Add to travelTime)
    if (isConnected('lights', 'travelTime')) {
       // Fixed duration for Level 3
       travelMinutes += lightsDuration;
    }

    // Congestion (Add to travelTime)
    if (isConnected('congestion', 'travelTime')) {
      if (congestion === '拥堵') {
        // Penalty ~7-9 mins
        // Base math for Level 6: 28.25 + 7~9 = 35.25 ~ 37.25
        // Rounds to 35, 36, 37.
        travelMinutes += 7 + Math.random() * 2;
      }
    }

    // Level 1 Override: Teleportation prevention
    if (levelId === 1 && travelMinutes === 0) {
        // Base 20.5 + noise
        travelMinutes = 20.5;
    }

    // Global Random Noise for ALL levels (Small variance)
    // Range: -0.4 to +0.4 minutes
    let globalNoise = (Math.random() * 0.8) - 0.4; 
    
    // TWEAK FOR LEVEL 4 (Rain):
    // Math: 7km / 16km/h = 26.25 min + 2 min lights = 28.25 min.
    // We need results to be 8:27 or 8:28.
    // 28.25 rounds to 28.
    // If noise is > +0.25, it becomes 28.5+ which rounds to 29 (8:29) -> Incorrect.
    // So we clamp noise for Level 4 to be slightly negative biased.
    if (levelId === 4) {
        // Range: -0.8 to +0.2
        globalNoise = (Math.random() * 1.0) - 0.8;
    }

    if (travelMinutes > 0) {
        travelMinutes += globalNoise;
    }

    // Ensure non-negative
    if (travelMinutes < 0) travelMinutes = 1;

    // 4. Final Calculation
    let arrivalTime = departureTime;
    
    if (isConnected('travelTime', 'arrival')) {
      arrivalTime += travelMinutes;
    } else if (isConnected('departure', 'arrival')) {
      arrivalTime += travelMinutes;
    }

    // Round for display
    const finalMinutes = Math.round(travelMinutes);
    const finalTimeStr = formatTime(Math.round(arrivalTime));

    results.push({
      runId: i + 1,
      arrivalTime: finalTimeStr,
      travelDurationMinutes: finalMinutes,
      details: `耗时: ${finalMinutes}分 ${congestion === '拥堵' ? '(拥堵)' : ''}`,
      nodeUpdates
    });
  }

  return results;
};

// Check if current graph structure matches level requirements
export const validateGraph = (
  connections: Connection[], 
  requiredConnections: string[]
): boolean => {
  const connectionStrings = connections.map(c => `${c.source}-${c.target}`);
  // Check if every required connection exists in the user's connections
  return requiredConnections.every(req => connectionStrings.includes(req));
};