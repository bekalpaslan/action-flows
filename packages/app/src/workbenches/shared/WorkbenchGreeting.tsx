import type { WorkbenchId } from '@/lib/types';
import { WORKBENCHES } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

const GREETINGS: Record<WorkbenchId, string> = {
  work: 'What needs building?',
  explore: 'What shall we discover?',
  review: 'What needs auditing?',
  pm: "What's the priority?",
  settings: 'System status: nominal.',
  archive: 'Search your history.',
  studio: 'Ready to experiment.',
};

interface WorkbenchGreetingProps {
  workbenchId: WorkbenchId;
}

export function WorkbenchGreeting({ workbenchId }: WorkbenchGreetingProps) {
  const meta = WORKBENCHES.find((wb) => wb.id === workbenchId);
  const greeting = GREETINGS[workbenchId];

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-body">
          <span className="text-body font-semibold">{meta?.label ?? workbenchId}</span>
          {' agent: '}
          <span className="text-accent">&bull;</span>{' '}
          {greeting}
        </p>
      </CardContent>
    </Card>
  );
}
