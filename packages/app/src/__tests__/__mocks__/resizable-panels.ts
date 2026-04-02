import React from 'react';

export function Group({ children, ...props }: any) {
  return React.createElement('div', { 'data-testid': 'panel-group', 'data-orientation': props.orientation, ...props }, children);
}

export function Panel({ children, ...props }: any) {
  return React.createElement('div', { 'data-testid': 'panel', ...props }, children);
}

export function Separator(props: any) {
  return React.createElement('div', { 'data-testid': 'panel-separator', role: 'separator', ...props });
}

export function useDefaultLayout(_opts: any) {
  return { defaultLayout: undefined, onLayoutChanged: () => {} };
}
