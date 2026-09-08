"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Upload, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mediaUrl } from "@/lib/utils";
import { validateNomineeImageFile } from "@/lib/validation/nominee";

export interface NomineeImageFieldHandle {
  /** null = untouched (keep existing on edit), "clear" = explicit removal not supported by API so just untouched */
  file: File | null;
}

/**
 * Uncontrolled-ish image picker: holds its own preview state and reports the
 * selected File up via onChange. Submitting the parent form with `file ===
 * null` means "leave the existing image alone" on edit, or "no photo" on
 * create — both are valid since `image` is optional on the backend.
 */
export function NomineeImageField({
  existingImageUrl,
  disabled,
  onChange,
}: {
  existingImageUrl?: string | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    if (!next) return;

    const error = validateNomineeImageFile(next);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
    onChange(next);
  }

  function clearSelection() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displaySrc = previewUrl ?? mediaUrl(existingImageUrl);

  return (
    <div className="space-y-2">
      <Label>Photo</Label>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border border-border/60 bg-surface-elevated">
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displaySrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="h-7 w-7 text-stone/40" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            id="nominee-image-input"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {displaySrc ? "Change photo" : "Upload photo"}
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={clearSelection}
              >
                <X className="h-3.5 w-3.5" />
                Undo
              </Button>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-stone">
            {displaySrc ? null : <ImageOff className="h-3 w-3" />}
            JPG or PNG, up to 5MB. Optional.
          </p>
        </div>
      </div>
    </div>
  );
}
