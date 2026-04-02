import React from 'react';

export function PanelGroup({ children, ...props }: any) {
  return React.createElement('div', { 'data-testid': 'panel-group', 'data-direction': props.direction, ...props }, children);
}

export function Panel({ children, ...props }: any) {
  return React.createElement('div', { 'data-testid': 'panel', ...props }, children);
}

export function PanelResizeHandle(props: any) {
  return React.createElement('div', { 'data-testid': 'panel-resize-handle', role: 'separator', ...props });
}
