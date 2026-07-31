"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { ParsedIcumsRow } from "@/lib/icums-paste";

interface ImportSummary {
  imported: number;
  duplicates: number;
  hdvUpserted: number;
  parseErrors: string[];
  skipped: number;
}

/** Paste the ICUMS results table, preview what was understood, then import. */
export function IcumsImportForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedIcumsRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(dryRun: boolean) {
    if (text.trim().length < 10) {
      toast.error("Paste the results table first");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/icums-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, dryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Import failed");
        setParseErrors(data.parseErrors ?? []);
        return;
      }
      if (dryRun) {
        setPreview(data.preview ?? []);
        setParseErrors(data.parseErrors ?? []);
        setSummary(null);
        if ((data.preview ?? []).length === 0) toast.warning("No usable rows found");
      } else {
        setSummary(data);
        setParseErrors(data.parseErrors ?? []);
        setPreview(null);
        setText("");
        toast.success(`Imported ${data.imported} row${data.imported === 1 ? "" : "s"}`);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <Label htmlFor="icums-paste" className="text-base font-semibold">
          Paste the ICUMS results table
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          On the portal, search a Make / Model / Year, select the results table, copy it
          (Ctrl&nbsp;+&nbsp;C) and paste below. The header row is optional.
        </p>
        <Textarea
          id="icums-paste"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"1\tSE\t2025\tTOYOTA\tCAMRY\t31,000\tUSD\tUS\t8703402000\t11.2981\t06/07/2026\t01/07/2026\t309,985.86\t154,717.49"}
          className="mt-3 font-mono text-xs"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => call(true)}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Preview
          </Button>
          <Button variant="gradient" disabled={busy} onClick={() => call(false)}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <ClipboardPaste className="h-4 w-4" /> Import rows
          </Button>
        </div>
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" /> {parseErrors.length} line
            {parseErrors.length === 1 ? "" : "s"} couldn&apos;t be read
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            {parseErrors.slice(0, 8).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {summary && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" /> Import complete
          </p>
          <p className="mt-1 text-muted-foreground">
            {summary.imported} new assessment{summary.imported === 1 ? "" : "s"} ·{" "}
            {summary.duplicates} already on file · {summary.hdvUpserted} HDV reference
            {summary.hdvUpserted === 1 ? "" : "s"} updated
          </p>
        </div>
      )}

      {preview && preview.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">
            Preview — {preview.length} row{preview.length === 1 ? "" : "s"} understood
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Vehicle</th>
                  <th className="py-2 pr-3 font-medium">Trim</th>
                  <th className="py-2 pr-3 font-medium">HDV</th>
                  <th className="py-2 pr-3 font-medium">HS code</th>
                  <th className="py-2 pr-3 font-medium">FX</th>
                  <th className="py-2 pr-3 font-medium">CIF</th>
                  <th className="py-2 pr-3 font-medium">Total tax</th>
                  <th className="py-2 font-medium">Assessed</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      {r.yearOfManufacture} {r.make} {r.model}
                    </td>
                    <td className="py-2 pr-3">{r.trimLevel ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {r.hdv != null ? formatCurrency(r.hdv, r.currency) : "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.hsCode ?? "—"}</td>
                    <td className="py-2 pr-3 tabular-nums">{r.exchangeRate ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {r.cifNcy != null ? formatCurrency(r.cifNcy) : "—"}
                    </td>
                    <td className="py-2 pr-3 font-medium">{formatCurrency(r.totalTax)}</td>
                    <td className="py-2">{r.assessmentDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
