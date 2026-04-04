import { ContentListItem, type ContentListItemData } from './ContentListItem';

export type { ContentListItemData };

export interface ContentListProps {
  items: ContentListItemData[];
  emptyHeading: string;
  emptyBody: string;
}

export function ContentList({ items, emptyHeading, emptyBody }: ContentListProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center" role="status">
        <h3 className="text-heading font-semibold">{emptyHeading}</h3>
        <p className="text-body text-text-dim mt-2">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div role="list" className="flex flex-col">
      {items.map((item) => (
        <ContentListItem key={item.id} item={item} />
      ))}
    </div>
  );
}
