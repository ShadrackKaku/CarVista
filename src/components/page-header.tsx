import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  className,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("border-b bg-gradient-to-b from-brand-50/60 to-background", className)}>
      <div className="container-page py-10 sm:py-14">
        {eyebrow && (
          <span className="mb-2 inline-block text-sm font-semibold uppercase tracking-wide text-brand-600">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
