import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { sendMessage } from '@/hooks/useChatSend';
import { toast } from '@/lib/toast';
import type { FlowDefinition } from '@/stores/flowStore';
import type { WorkbenchId } from '@/lib/types';

export interface FlowCardProps {
  flow: FlowDefinition;
  workbenchId: WorkbenchId;
  disabled?: boolean;
}

/**
 * Individual flow card with name, description, category badge, action count badge,
 * and a Run Flow button that sends the flow name as a chat message to the workbench agent.
 */
export function FlowCard({ flow, workbenchId, disabled }: FlowCardProps) {
  const actionCount = flow.chainTemplate?.split('->').length ?? 0;

  function handleRunFlow() {
    sendMessage(workbenchId, '/run ' + flow.name);
    toast.success("Flow '" + flow.name + "' started.");
  }

  return (
    <Card interactive={true} role="listitem">
      <CardHeader>
        <CardTitle>{flow.name}</CardTitle>
        <CardDescription>{flow.description}</CardDescription>
      </CardHeader>
      <CardFooter className="gap-2">
        <Badge variant="default">{flow.category}</Badge>
        <Badge variant="info">{actionCount} actions</Badge>
        <Button
          variant="primary"
          size="sm"
          className="ml-auto"
          aria-label={`Run ${flow.name}`}
          onClick={handleRunFlow}
          disabled={disabled}
        >
          Run Flow
        </Button>
      </CardFooter>
    </Card>
  );
}
