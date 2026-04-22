export function AppHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <h1 className="font-semibold">{title}</h1>
    </div>
  );
}
