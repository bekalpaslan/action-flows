import React from 'react';
import { vi } from 'vitest';

export function ReactFlow({ children, ...props }: any) {
  return React.createElement('div', { 'data-testid': 'react-flow', ...props }, children);
}

export function Handle(props: any) {
  return React.createElement('div', {
    'data-testid': 'handle',
    'data-type': props.type,
    'data-position': props.position,
  });
}

export const Position = {
  Left: 'left',
  Right: 'right',
  Top: 'top',
  Bottom: 'bottom',
} as const;

export function useNodesState(initial?: any) {
  return [initial || [], vi.fn(), vi.fn()];
}

export function useEdgesState(initial?: any) {
  return [initial || [], vi.fn(), vi.fn()];
}

export function useReactFlow() {
  return {
    fitView: vi.fn(),
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
  };
}

export function BaseEdge(props: any) {
  return React.createElement('path', { 'data-testid': 'base-edge', d: props.path });
}

export function getSmoothStepPath(): [string, number, number] {
  return ['M0,0 L100,100', 50, 50];
}

export function ReactFlowProvider({ children }: any) {
  return children;
}
