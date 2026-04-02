import { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { usePipelineStore } from '@/stores/pipelineStore';
import type { NodeStatus, StepNodeData } from '@/lib/pipeline-types';
import { formatElapsed } from '@/components/pipeline/StepNode';
import type { WorkbenchId } from '@/lib/types';

interface PipelineDrawerProps {
  workbenchId: WorkbenchId;
}

const badgeVariantMap: Record<NodeStatus, 'default' | 'accent' | 'success' | 'error'> = {
  pending: 'default',
  running: 'accent',
  complete: 'success',
  failed: 'error',
  skipped: 'default',
};

/**
 * Node detail drawer overlaying the pipeline region from the right.
 * Opens when a node is selected, closes on X button, Escape, or deselection.
 * Per D-03 (click-to-inspect) and UI-SPEC Drawer Layout.
 */
export function PipelineDrawer({ workbenchId }: PipelineDrawerProps) {
  const pipeline = usePipelineStore((s) => s.pipelines.get(workbenchId));
  const selectNode = usePipelineStore((s) => s.selectNode);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [expandedInputs, setExpandedInputs] = useState(false);
  const [expandedResult, setExpandedResult] = useState(false);
  const [showFullResult, setShowFullResult] = useState(false);

  const isOpen = Boolean(pipeline?.drawerOpen && pipeline?.selectedNodeId);

  // Focus close button on open
  useEffect(() => {
    if (isOpen) {
      // Reset collapsible state on node change
      setExpandedInputs(false);
      setExpandedResult(false);
      setShowFullResult(false);

      // Delay focus slightly to allow render
      const raf = requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen, pipeline?.selectedNodeId]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectNode(workbenchId, null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectNode, workbenchId]);

  if (!isOpen || !pipeline?.selectedNodeId) return null;

  const node = pipeline.nodes.find((n) => n.id === pipeline.selectedNodeId);
  if (!node) return null;

  const nodeData = node.data;

  return (
    <div
      className={cn(
        'absolute right-0 top-0 bottom-0 w-[320px] z-[1200]',
        'bg-surface-3 border-l border-border-strong',
        'rounded-tl-lg rounded-bl-lg shadow-lg',
        'overflow-y-auto'
      )}
      style={{
        transition: 'transform 200ms ease-out',
        transform: 'translateX(0)',
      }}
      role="dialog"
      aria-labelledby="drawer-title"
    >
      {/* Close button */}
      <Button
        ref={closeButtonRef}
        variant="ghost"
        size="icon"
        onClick={() => selectNode(workbenchId, null)}
        className="absolute right-3 top-3 z-10"
        aria-label="Close details"
      >
        <X size={16} />
      </Button>

      <div className="p-4 pt-5">
        {nodeData.type === 'step' ? (
          <StepDetail
            data={nodeData}
            expandedInputs={expandedInputs}
            setExpandedInputs={setExpandedInputs}
            expandedResult={expandedResult}
            setExpandedResult={setExpandedResult}
            showFullResult={showFullResult}
            setShowFullResult={setShowFullResult}
          />
        ) : (
          <GateDetail data={nodeData} />
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Step detail sub-component
// -------------------------------------------------------------------

interface StepDetailProps {
  data: StepNodeData;
  expandedInputs: boolean;
  setExpandedInputs: (v: boolean) => void;
  expandedResult: boolean;
  setExpandedResult: (v: boolean) => void;
  showFullResult: boolean;
  setShowFullResult: (v: boolean) => void;
}

function StepDetail({
  data,
  expandedInputs,
  setExpandedInputs,
  expandedResult,
  setExpandedResult,
  showFullResult,
  setShowFullResult,
}: StepDetailProps) {
  const resultStr = data.result != null ? JSON.stringify(data.result, null, 2) : null;
  const isResultTruncated = resultStr != null && resultStr.length > 500;

  return (
    <>
      {/* Header: name + status badge */}
      <div className="flex items-center gap-2 pr-10">
        <h3 id="drawer-title" className="text-heading font-semibold text-text truncate">
          {data.name}
        </h3>
        <Badge variant={badgeVariantMap[data.status]} size="sm">
          {data.status}
        </Badge>
      </div>

      {/* Metadata */}
      <div className="mt-4 space-y-2">
        <MetadataRow label="Agent Model" value={data.agentModel ?? 'Unknown'} />
        <MetadataRow
          label="Duration"
          value={data.elapsedMs != null ? formatElapsed(data.elapsedMs) : '--'}
        />
        <MetadataRow label="Step" value={String(data.stepNumber)} />
        <MetadataRow
          label="Started"
          value={data.startedAt ? new Date(data.startedAt).toLocaleTimeString() : '--'}
        />
      </div>

      {/* Description */}
      {data.description && (
        <div className="mt-4">
          <p className="text-body text-text break-words">{data.description}</p>
        </div>
      )}

      {/* Inputs (collapsible) */}
      {data.inputs && (
        <CollapsibleSection
          label="Inputs"
          expanded={expandedInputs}
          onToggle={() => setExpandedInputs(!expandedInputs)}
        >
          <Card variant="flat">
            <CardContent className="p-3">
              <pre className="font-mono text-caption text-text-dim whitespace-pre-wrap break-all">
                {JSON.stringify(data.inputs, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </CollapsibleSection>
      )}

      {/* Result (collapsible) */}
      {resultStr && (
        <CollapsibleSection
          label="Result"
          expanded={expandedResult}
          onToggle={() => setExpandedResult(!expandedResult)}
        >
          <Card variant="flat">
            <CardContent className="p-3">
              <pre className="font-mono text-caption text-text-dim whitespace-pre-wrap break-all">
                {showFullResult || !isResultTruncated
                  ? resultStr
                  : resultStr.slice(0, 500) + '...'}
              </pre>
              {isResultTruncated && !showFullResult && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowFullResult(true)}
                >
                  Show more
                </Button>
              )}
            </CardContent>
          </Card>
        </CollapsibleSection>
      )}

      {/* Error */}
      {data.error && (
        <div className="mt-4 border-l-2 border-destructive p-3 rounded-r-md bg-surface-2">
          <p className="text-caption text-destructive font-semibold">Error</p>
          <p className="text-caption text-destructive mt-1 break-words">{data.error}</p>
          {data.suggestion && (
            <p className="text-caption text-text-dim mt-2 break-words">
              Suggestion: {data.suggestion}
            </p>
          )}
        </div>
      )}

      {/* File Changes */}
      {data.fileChanges && data.fileChanges.length > 0 && (
        <div className="mt-4">
          <p className="text-caption font-semibold text-text-dim mb-2">File Changes</p>
          <ul className="space-y-1">
            {data.fileChanges.map((fc, i) => (
              <li key={i} className="flex items-center gap-2 text-caption">
                <Badge
                  variant={
                    fc.type === 'created'
                      ? 'success'
                      : fc.type === 'modified'
                        ? 'accent'
                        : 'error'
                  }
                  size="sm"
                >
                  {fc.type}
                </Badge>
                <span className="text-text-dim truncate font-mono">{fc.path}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------------
// Gate detail sub-component
// -------------------------------------------------------------------

interface GateDetailData {
  type: 'gate';
  label: string;
  status: NodeStatus;
  passCount: number;
  failCount: number;
  outcome: string | null;
}

function GateDetail({ data }: { data: GateDetailData }) {
  return (
    <>
      {/* Header: label + status badge */}
      <div className="flex items-center gap-2 pr-10">
        <h3 id="drawer-title" className="text-heading font-semibold text-text truncate">
          {data.label}
        </h3>
        <Badge variant={badgeVariantMap[data.status]} size="sm">
          {data.status}
        </Badge>
      </div>

      {/* Metadata */}
      <div className="mt-4 space-y-2">
        <MetadataRow label="Pass Count" value={String(data.passCount)} />
        <MetadataRow label="Fail Count" value={String(data.failCount)} />
        <MetadataRow label="Outcome" value={data.outcome ?? 'Pending'} />
      </div>
    </>
  );
}

// -------------------------------------------------------------------
// Shared sub-components
// -------------------------------------------------------------------

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-caption font-semibold text-text-dim">{label}</span>
      <span className="text-caption text-text">{value}</span>
    </div>
  );
}

interface CollapsibleSectionProps {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ label, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="mt-4">
      <button
        type="button"
        className="flex items-center gap-1 text-caption font-semibold text-text-dim hover:text-text transition-colors"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {label}
      </button>
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
}
