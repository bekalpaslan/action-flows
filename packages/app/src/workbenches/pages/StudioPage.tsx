import { useMemo } from 'react';
import { WorkbenchGreeting } from '../shared/WorkbenchGreeting';
import { ContentList, type ContentListItemData } from '../shared/ContentList';
import { FlowBrowser } from '../shared/FlowBrowser';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUIStore } from '@/stores/uiStore';
import { componentManifest } from '@/components/ui/manifest';

export function StudioPage() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);

  const componentItems: ContentListItemData[] = useMemo(
    () =>
      componentManifest.map((entry) => ({
        id: entry.name,
        primary: entry.name,
        secondary: entry.description,
        status: 'complete' as const,
        timestamp: `${Object.values(entry.variants).flat().length} variants`,
      })),
    []
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <WorkbenchGreeting workbenchId={activeWorkbench} />

      <Tabs defaultValue="components">
        <TabsList>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="components">
          <ContentList
            items={componentItems}
            emptyHeading="No components found"
            emptyBody="Component manifest is empty."
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="py-12 text-center rounded-lg border border-border bg-surface-2">
            <h3 className="text-heading font-semibold">Canvas is empty</h3>
            <p className="text-body text-text-dim mt-2">
              Select a component from the library to preview and experiment with.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <FlowBrowser context="studio" />
    </div>
  );
}
