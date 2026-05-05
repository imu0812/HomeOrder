import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrderDetailLoading() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="grid gap-3">
          <div className="h-6 w-56 rounded-md bg-muted" />
          <div className="h-4 w-40 rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-24 rounded-md bg-muted" />
            <div className="h-24 rounded-md bg-muted" />
          </div>
          <div className="h-10 w-80 rounded-md bg-muted" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-5 w-28 rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="h-12 rounded-md bg-muted" />
          <div className="h-12 rounded-md bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
