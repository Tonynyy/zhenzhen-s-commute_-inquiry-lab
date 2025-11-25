export enum NodeType {
  INPUT = 'INPUT',      // User sets a value (Time, Number, Enum)
  CALC = 'CALC',        // Automatically calculates based on inputs
  OUTPUT = 'OUTPUT'     // The final result
}

export enum NodeCategory {
  TIME = 'TIME',
  PHYSICS = 'PHYSICS',
  ENVIRONMENT = 'ENVIRONMENT',
  RESULT = 'RESULT'
}

export interface NodeData {
  id: string;
  label: string;
  type: NodeType;
  category: NodeCategory;
  x: number;
  y: number;
  value: string | number;
  unit?: string;
  options?: string[]; // For dropdowns
  description?: string; // Helper text
}

export interface Connection {
  id: string;
  source: string;
  target: string;
}

export interface SimulationResult {
  runId: number;
  arrivalTime: string; // HH:mm
  travelDurationMinutes: number;
  details: string;
  nodeUpdates?: Record<string, string | number>; // Logic to update UI nodes based on physics
}

export interface LevelConfig {
  id: number;
  title: string;
  question: string;
  decisionPrompt?: string; // Question shown in the result panel
  availableNodes: NodeData[]; // Nodes available in the toolbox for this level
  requiredConnections: string[]; // Simplistic check for "correct" model structure
  correctAnswer: string; // For the final multiple choice
  options: string[]; // Multiple choice options
  clues: ChatMessage[]; // Pre-defined responses from Zhenzhen
}

export interface ChatMessage {
  id: string;
  question: string; // What the user asks
  answer: string;   // What Zhenzhen replies
  unlockedNodeIds?: string[]; // If asking this unlocks specific nodes (optional mechanic)
}

export interface LogEntry {
  type: 'info' | 'success' | 'error';
  message: string;
}