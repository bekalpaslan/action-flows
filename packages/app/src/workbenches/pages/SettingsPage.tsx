import { useCallback } from 'react';
import { WorkbenchGreeting } from '../shared/WorkbenchGreeting';
import { StatCard } from '../shared/StatCard';
import { FlowBrowser } from '../shared/FlowBrowser';
import { useValidationStore, type AutonomyLevel } from '@/stores/validationStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { WORKBENCHES, type WorkbenchId } from '@/lib/types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SkillsPanel } from '../settings/SkillsPanel';
import { ScheduledTasksPanel } from '../settings/ScheduledTasksPanel';
import { CustomWorkbenchesPanel } from '../settings/CustomWorkbenchesPanel';
import { HealingHistoryPanel } from '../settings/HealingHistoryPanel';
import { LearningsBrowser } from '../settings/LearningsBrowser';
import { McpConfigPanel } from '../settings/McpConfigPanel';

const AUTONOMY_OPTIONS: AutonomyLevel[] = ['full', 'supervised', 'manual'];

export function SettingsPage() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  const autonomyLevels = useValidationStore((s) => s.autonomyLevels);
  const setAutonomyLevel = useValidationStore((s) => s.setAutonomyLevel);
  const activeCount = useSessionStore((s) => s.getActiveCount());

  const activeWb = WORKBENCHES.find((wb) => wb.id === activeWorkbench);
  const workbenchLabel = activeWb?.label ?? activeWorkbench;

  const handleAutonomyChange = useCallback(
    async (workbenchId: WorkbenchId, level: AutonomyLevel) => {
      // Optimistic UI update
      setAutonomyLevel(workbenchId, level);
      try {
        await fetch(`/api/approvals/autonomy/${workbenchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level }),
        });
      } catch {
        // Revert on failure would go here in production
        console.error('[Settings] Failed to update autonomy level');
      }
    },
    [setAutonomyLevel]
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <WorkbenchGreeting workbenchId={activeWorkbench} />

      {/* Autonomy Levels -- preserved from Phase 8 */}
      <div className="p-6 max-w-2xl">
        <h2 className="text-heading font-semibold mb-4">Workbench Autonomy Levels</h2>
        <p className="text-body text-text-dim mb-4">
          Control how much autonomy each workbench agent has.
        </p>
        <div className="flex flex-col gap-3">
          {WORKBENCHES.map((wb) => {
            const level = autonomyLevels.get(wb.id) ?? 'supervised';
            return (
              <div key={wb.id} className="flex items-center justify-between">
                <span className="text-body">{wb.label}</span>
                <Select
                  value={level}
                  onValueChange={(val: string) =>
                    handleAutonomyChange(wb.id, val as AutonomyLevel)
                  }
                >
                  <SelectTrigger className="w-[160px]" aria-label={`Autonomy level for ${wb.label}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTONOMY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Health */}
      <div>
        <h2 className="text-heading font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Active agents" value={activeCount} />
          <StatCard label="Violations today" value={0} />
          <StatCard label="Uptime" value="--" />
        </div>
      </div>

      {/* Extensions — Phase 10 */}
      <div>
        <h2 className="text-heading font-semibold mb-4">Extensions</h2>
        <Tabs defaultValue="skills">
          <TabsList className="gap-2">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="scheduled-tasks">Scheduled Tasks</TabsTrigger>
            <TabsTrigger value="custom-workbenches">Custom Workbenches</TabsTrigger>
            <TabsTrigger value="healing">Healing</TabsTrigger>
            <TabsTrigger value="learnings">Learnings</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
          </TabsList>
          <TabsContent value="skills" className="pt-4">
            <SkillsPanel workbenchId={activeWorkbench} workbenchLabel={workbenchLabel} />
          </TabsContent>
          <TabsContent value="scheduled-tasks" className="pt-4">
            <ScheduledTasksPanel workbenchId={activeWorkbench} workbenchLabel={workbenchLabel} />
          </TabsContent>
          <TabsContent value="custom-workbenches" className="pt-4">
            <CustomWorkbenchesPanel />
          </TabsContent>
          <TabsContent value="healing" className="pt-4">
            <HealingHistoryPanel />
          </TabsContent>
          <TabsContent value="learnings" className="pt-4">
            <LearningsBrowser />
          </TabsContent>
          <TabsContent value="mcp" className="pt-4">
            <McpConfigPanel />
          </TabsContent>
        </Tabs>
      </div>

      <FlowBrowser context="settings" />
    </div>
  );
}
