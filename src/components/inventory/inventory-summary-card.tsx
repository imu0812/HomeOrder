import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function InventorySummaryCard({ title, value, description }: { title: string; value: number | string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}: {value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
