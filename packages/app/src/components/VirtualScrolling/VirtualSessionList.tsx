/**
 * VirtualSessionList - Virtualized session list using react-window
 *
 * Efficiently renders large lists of sessions by only rendering visible items.
 * Performance improvement: O(n) → O(1) rendering for large session lists
 *
 * Usage:
 *   <VirtualSessionList
 *     sessions={sessions}
 *     onSessionClick={handleClick}
 *     renderSession={(session) => <SessionItem session={session} />}
 *   />
 */

import React from 'react';
import { FixedSizeList as List } from 'react-window';
import type { SessionId } from '@afw/shared';

export interface VirtualSessionListProps<T> {
  items: T[];
  onItemClick?: (item: T) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  maxHeight?: number;
  width?: number | string;
  className?: string;
}

/**
 * Row renderer for the virtual list
 */
const Row = ({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
  };
}) => {
  const item = data.items[index];

  return (
    <div style={style}>
      {data.renderItem(item, index)}
    </div>
  );
};

/**
 * VirtualSessionList component
 */
export const VirtualSessionList = React.forwardRef<HTMLDivElement, VirtualSessionListProps<any>>(
  ({
    items,
    onItemClick,
    renderItem,
    itemHeight,
    maxHeight = 400,
    width = '100%',
    className,
  }, ref) => {
    return (
      <div ref={ref} className={className}>
        <List
          height={maxHeight}
          itemCount={items.length}
          itemSize={itemHeight}
          width={width}
          itemData={{ items, renderItem, onItemClick }}
        >
          {Row}
        </List>
      </div>
    );
  }
);

VirtualSessionList.displayName = 'VirtualSessionList';

export default VirtualSessionList;
