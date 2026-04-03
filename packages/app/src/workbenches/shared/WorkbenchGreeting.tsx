import { Card, CardContent } from '@/components/ui/card';
import { WORKBENCHES, type WorkbenchId } from '@/lib/types';

export interface WorkbenchGreetingProps {
  workbenchId: WorkbenchId;
}

export function WorkbenchGreeting({ workbenchId }: WorkbenchGreetingProps) {
  const meta = WORKBENCHES.find((w) => w.id === workbenchId);

  if (!meta) {
    return null;
  }

  return (
    <Card variant="flat" interactive={false}>
      <CardContent className="p-4 flex items-center gap-3">
        <span className="text-accent text-lg">&#x25CF;</span>
        <div>
          <p className="text-body font-semibold">{meta.label} Agent</p>
          <p className="text-body">{meta.greeting}</p>
        </div>
      </CardContent>
    </Card>
  );
}
