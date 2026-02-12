/**
 * Mock Data Factories for Component Tests
 *
 * Provides consistent test data factories to reduce duplication and ensure
 * test data consistency across all component tests.
 */

import type {
  Session,
  SessionId,
  UserId,
  GateCheckpoint,
  RegionId,
  WorkbenchId,
  ColorShift,
  HealthMetrics,
  ChatMessage,
  EdgeId,
  Timestamp,
} from '@afw/shared';
import { FogState } from '@afw/shared';
import type { NodeProps } from 'reactflow';

// ============================================================================
// Session and Chain Data
// ============================================================================

export const createMockSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-123' as SessionId,
  user: 'test-user' as UserId,
  status: 'in_progress' as const,
  chains: [],
  startedAt: '2024-01-01T00:00:00Z' as Timestamp,
  cwd: '/test/dir',
  ...overrides,
});

export const createMockChain = (overrides?: any) => ({
  id: 'chain-1',
  status: 'completed' as const,
  ...overrides,
});

export const createMockSessions = (count: number = 3): Session[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockSession({
      id: `session-${i + 1}` as SessionId,
      chains: [createMockChain({ id: `chain-${i + 1}` })],
    })
  );
};

// ============================================================================
// Gate and Position Data
// ============================================================================

export const createMockGate = (overrides?: Partial<GateCheckpoint>): GateCheckpoint => ({
  id: 'gate-1',
  bridgeId: 'bridge-1' as EdgeId,
  harmonyRule: 'contract:validation',
  passCount: 0,
  failCount: 0,
  lastChecked: '2024-01-01T00:00:00Z' as Timestamp,
  status: 'clear',
  ...overrides,
});

export const createMockPosition = (
  x: number = 100,
  y: number = 200
) => ({ x, y });

// ============================================================================
// Universe and Region Data
// ============================================================================

export const createMockUniverse = (overrides?: any) => ({
  regions: [
    {
      id: 'region-work',
      label: 'Work',
      workbenchId: 'work' as WorkbenchId,
      layer: 'experience' as const,
      position: createMockPosition(100, 100),
    },
  ],
  bridges: [],
  gates: [],
  ...overrides,
});

// ============================================================================
// RegionStar Component Data
// ============================================================================

export interface RegionStarData {
  regionId: RegionId;
  workbenchId: WorkbenchId;
  label: string;
  layer: 'platform' | 'template' | 'philosophy' | 'physics' | 'experience';
  fogState: any; // FogState enum
  glowIntensity: number;
  status: 'idle' | 'active' | 'waiting' | 'undiscovered';
  colorShift: ColorShift;
  health: HealthMetrics;
}

export const createMockColorShift = (overrides?: Partial<ColorShift>): ColorShift => ({
  baseColor: '#4a90e2',
  currentColor: '#4a90e2',
  saturation: 1,
  temperature: 0.5,
  ...overrides,
});

export const createMockHealthMetrics = (
  overrides?: Partial<HealthMetrics>
): HealthMetrics => ({
  contractCompliance: 1.0,
  activityLevel: 0.5,
  errorRate: 0.0,
  lastHealthCheck: '2024-01-01T00:00:00Z' as Timestamp,
  ...overrides,
});

export const createMockRegionStarData = (
  overrides?: Partial<RegionStarData>
): RegionStarData => ({
  regionId: 'region-work' as RegionId,
  workbenchId: 'work' as WorkbenchId,
  label: 'Work',
  layer: 'experience',
  fogState: FogState.REVEALED,
  glowIntensity: 0.5,
  status: 'active',
  colorShift: createMockColorShift(),
  health: createMockHealthMetrics(),
  ...overrides,
});

export const createMockRegionStarNodeProps = (
  overrides?: Partial<NodeProps<RegionStarData>>
): NodeProps<RegionStarData> => {
  const baseProps: any = {
    id: 'node-work',
    data: createMockRegionStarData(),
    selected: false,
    type: 'regionStar',
    xPos: 100,
    yPos: 100,
    dragging: false,
  };
  return { ...baseProps, ...overrides };
};

// ============================================================================
// Chat and Message Data
// ============================================================================

export const createMockChatMessage = (
  overrides?: Partial<ChatMessage>
): ChatMessage => ({
  id: 'msg-1',
  sessionId: 'session-123' as SessionId,
  role: 'user',
  content: 'Test message',
  timestamp: '2024-01-01T00:00:00Z' as Timestamp,
  messageType: 'text',
  ...overrides,
});

export const createMockChatMessages = (count: number = 2): ChatMessage[] => {
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date(Date.now() - i * 5000).toISOString() as Timestamp;
    return createMockChatMessage({
      id: `msg-${i + 1}`,
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: i % 2 === 0 ? `User message ${i + 1}` : `Assistant response ${i + 1}`,
      timestamp,
    });
  });
};

// ============================================================================
// Prompt and Button Data
// ============================================================================

export const createMockPromptButton = (overrides?: any) => ({
  id: 'prompt-1',
  text: 'Explain this',
  ...overrides,
});

export const createMockPromptButtons = (count: number = 2) => {
  return Array.from({ length: count }, (_, i) =>
    createMockPromptButton({
      id: `prompt-${i + 1}`,
      text: ['Explain this', 'Refactor this', 'Test this'][i] || `Prompt ${i + 1}`,
    })
  );
};

// ============================================================================
// Error and Notification Data
// ============================================================================

export const createMockError = (message: string = 'Test error') => {
  const error = new Error(message);
  return error;
};

export const createMockUnreadErrors = (count: number = 0) => {
  return Array.from({ length: count }, (_, i) =>
    createMockError(`Error ${i + 1}`)
  );
};
