"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onChange,
  max = 12,
  label = "Upload photos",
  hint = "The first image is used as the main photo. Up to 10 MB each.",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const configured = isCloudinaryConfigured();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!configured) {
      toast.error("Image uploads aren't configured yet.");
      return;
    }
    const remaining = max - value.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      toast.info(`You can upload up to ${max} images.`);
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of toUpload) {
      try {
        const { url } = await uploadToCloudinary(file);
        uploaded.push(url);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    }
    if (uploaded.length) {
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  function makePrimary(url: string) {
    onChange([url, ...value.filter((u) => u !== url)]);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
              <Image src={url} alt={`Photo ${i + 1}`} fill sizes="150px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Main
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(url)}
                    className="rounded-full bg-white/90 p-1.5 text-brand-700 hover:bg-white"
                    aria-label="Set as main photo"
                    title="Set as main photo"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(url)}
                  className="rounded-full bg-white/90 p-1.5 text-destructive hover:bg-white"
                  aria-label="Remove photo"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || value.length >= max}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          uploading ? "opacity-70" : "hover:border-brand-400 hover:bg-accent/40",
          value.length >= max && "cursor-not-allowed opacity-50",
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        ) : (
          <ImagePlus className="h-8 w-8 text-brand-500" />
        )}
        <span className="text-sm font-medium">
          {uploading ? "Uploading…" : value.length >= max ? `Maximum ${max} images` : label}
        </span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </button>

      {!configured && (
        <p className="mt-2 text-xs text-warning">
          Image uploads are not configured. Add your Cloudinary cloud name & upload preset to enable them.
        </p>
      )}
    </div>
  );
}
