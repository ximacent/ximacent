"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateElectionBanner } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import { mediaUrl } from "@/lib/utils";

const MAX_BANNER_BYTES = 5 * 1024 * 1024;

export function ElectionBannerUploader({
  electionId,
  bannerUrl,
}: {
  electionId: string;
  bannerUrl: string | null;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Object URLs are only good for the lifetime of this preview — revoke the
  // old one whenever it's replaced or the component unmounts, or it leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const { mutate, isPending } = useMutation({
    mutationFn: (nextFile: File) => updateElectionBanner(electionId, nextFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-election", electionId] });
      queryClient.invalidateQueries({ queryKey: ["admin-elections"] });
      queryClient.invalidateQueries({ queryKey: ["public-election", electionId] });
      toast.success("Banner updated");
      clearSelection();
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't upload banner", { description: message });
    },
  });

  function clearSelection() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    if (!next) return;

    if (!next.type.startsWith("image/")) {
      toast.error("That's not an image file");
      e.target.value = "";
      return;
    }
    if (next.size > MAX_BANNER_BYTES) {
      toast.error("Image is too large", { description: "Keep banners under 5MB." });
      e.target.value = "";
      return;
    }

    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }

  const displaySrc = previewUrl ?? mediaUrl(bannerUrl);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border border-border/60 bg-secondary/40">
        {displaySrc ? (
          // Plain <img>, not next/image — this also has to render freshly
          // selected local blob: previews, which next/image can't optimize.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displaySrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-stone">
            <ImageOff className="h-6 w-6" />
            <span className="text-xs">No banner set</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isPending}
        className="hidden"
        id="election-banner-input"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {bannerUrl || file ? "Choose a different image" : "Upload banner"}
        </Button>

        {file && (
          <>
            <Button type="button" size="sm" disabled={isPending} onClick={() => mutate(file)}>
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Save banner"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={clearSelection}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </>
        )}
      </div>
      <p className="text-xs text-stone">JPG or PNG, up to 5MB. Shown at the top of the public election page.</p>
    </div>
  );
}
