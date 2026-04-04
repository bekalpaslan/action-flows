import { Card, CardContent } from '@/components/ui/card';

export interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card variant="flat" interactive={false}>
      <CardContent className="p-4 text-center">
        <p className="text-display font-semibold">{value}</p>
        <p className="text-caption text-text-dim">{label}</p>
      </CardContent>
    </Card>
  );
}
