import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-display font-semibold">{value}</p>
        <p className="text-caption text-text-dim">{label}</p>
      </CardContent>
    </Card>
  );
}
