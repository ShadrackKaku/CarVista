/** The heading block at the top of a tool's content column. */
export function ToolHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </header>
  );
}
