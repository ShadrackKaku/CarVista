"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PERMISSIONS, STAFF_PRESETS, presetById, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/**
 * Change what one staff member may do.
 *
 * Presets and individual permissions sit together on purpose. A preset is what
 * you reach for when somebody changes job; the checkboxes are what you reach
 * for when somebody does two jobs, which is the case that made presets alone
 * insufficient in the first place.
 */
export function StaffAccessEditor({
  staffId,
  name,
  current,
}: {
  staffId: string;
  name: string;
  current: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>(current);

  const dirty =
    selected.length !== current.length || selected.some((p) => !current.includes(p));

  function toggle(p: Permission) {
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save their access");
        return;
      }
      toast.success(
        selected.length === 0
          ? `${name} no longer has access to the console.`
          : `Updated what ${name} can do.`,
      );
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-3 h-auto px-2 py-1 text-xs"
        onClick={() => {
          setSelected(current);
          setOpen(true);
        }}
      >
        <Pencil className="h-3 w-3" />
        Change access
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border bg-background p-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Start from a role
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STAFF_PRESETS.map((preset) => {
            const exact =
              preset.permissions.length === selected.length &&
              preset.permissions.every((p) => selected.includes(p));
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={exact}
                onClick={() => setSelected([...presetById(preset.id)!.permissions])}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  exact
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Or pick exactly
        </p>
        <div className="mt-2 space-y-1.5">
          {(Object.keys(PERMISSIONS) as Permission[])
            // staff:manage is never grantable — it is the permission that grants
            // permissions, and it stays with the super admin.
            .filter((p) => p !== "staff:manage")
            .map((p) => (
              <label key={p} className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selected.includes(p)}
                  onChange={() => toggle(p)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-input"
                />
                <span className={cn(p === "escrow:manage" && "font-medium")}>
                  {PERMISSIONS[p]}
                </span>
              </label>
            ))}
        </div>
      </div>

      {selected.length === 0 && (
        <p className="flex items-start gap-1.5 rounded-lg bg-warning/10 px-2.5 py-1.5 text-xs text-foreground">
          <ShieldOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <span>
            With nothing selected, {name} loses the admin console entirely. Their account still
            works as an ordinary one.
          </span>
        </p>
      )}

      <div className="flex gap-2 border-t pt-3">
        <Button size="sm" variant="gradient" onClick={save} disabled={busy || !dirty}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
