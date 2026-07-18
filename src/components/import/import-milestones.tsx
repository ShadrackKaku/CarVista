import { IMPORT_STAGES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";

type Milestone = {
  id: string;
  stage: string;
  title: string;
  description: string | null;
  location: string | null;
  timestamp: Date;
};

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

/** The real, ops-posted milestone updates for an import, newest first. */
export function ImportMilestones({ events }: { events: Milestone[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No updates yet — we'll post each milestone here as your import progresses.
      </p>
    );
  }
  return (
    <ol>
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
          {i < events.length - 1 && (
            <span className="absolute bottom-0 left-[5px] top-4 w-px bg-border" aria-hidden />
          )}
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{e.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(e.timestamp)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stageLabel(e.stage)}
              {e.location ? ` · ${e.location}` : ""}
            </p>
            {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
