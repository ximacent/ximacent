"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/admin/error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { ElectionBannerUploader } from "@/components/admin/elections/election-banner-uploader";
import { ElectionCategoriesPanel } from "@/components/admin/elections/election-categories-panel";
import { ElectionForm } from "@/components/admin/elections/election-form";
import { ElectionStatusActions } from "@/components/admin/elections/election-status-actions";
import { deleteElections, getElection, updateElection } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import { fromDateTimeLocalValue, formatDateTime, toDateTimeLocalValue } from "@/lib/utils";
import type { ElectionFormValues } from "@/lib/validation/election";

export function EditElectionClient({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    data: election,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-election", id],
    queryFn: () => getElection(id),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ElectionFormValues) =>
      updateElection(id, {
        title: values.title,
        description: values.description?.trim() || undefined,
        startDate: fromDateTimeLocalValue(values.startDate),
        endDate: fromDateTimeLocalValue(values.endDate),
        // Omit entirely once locked, rather than resend the unchanged value —
        // the field is disabled in the form so it could never actually change.
        ...(election?.status === "draft" ? { pricePerVote: values.pricePerVote } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-election", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-elections"] });
      toast.success("Election updated");
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't save changes", { description: message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteElections([id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-elections"] });
      toast.success("Election deleted");
      router.push("/admin/elections");
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't delete election", { description: message });
      setConfirmingDelete(false);
    },
  });

  return (
    <div className="p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Link
          href="/admin/elections"
          className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm text-stone hover:text-cream"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to elections
        </Link>

        {election && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-display-md text-cream">{election.title}</h1>
            <AdminStatusBadge status={election.status} />
          </div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="surface-card mt-8 max-w-2xl space-y-4 p-6 md:p-8">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !election ? (
        <div className="surface-card mt-8">
          <ErrorState
            title="Couldn't load this election"
            description="It may have been removed, or there was a connection problem."
            onRetry={() => refetch()}
          />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            className="mt-6 flex flex-wrap items-center gap-2"
          >
            <ElectionStatusActions election={election} size="default" />
            <Button variant="outline" asChild>
              <a href={`/elections/${election.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                View public page
              </a>
            </Button>
            <Button
              variant="outline"
              className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="surface-card mt-6 max-w-2xl p-6 md:p-8"
          >
            <h2 className="mb-4 font-display text-base text-cream">Banner</h2>
            <ElectionBannerUploader electionId={election.id} bannerUrl={election.bannerUrl} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="mt-8 max-w-4xl"
          >
            <ElectionCategoriesPanel electionId={election.id} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
            className="surface-card mt-6 max-w-2xl p-6 md:p-8"
          >
            <ElectionForm
              mode="edit"
              status={election.status}
              defaultValues={{
                title: election.title,
                description: election.description ?? "",
                startDate: toDateTimeLocalValue(election.startDate),
                endDate: toDateTimeLocalValue(election.endDate),
                pricePerVote: election.pricePerVote,
              }}
              isSubmitting={updateMutation.isPending}
              onSubmit={(values) => updateMutation.mutate(values)}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="mt-4 max-w-2xl text-xs text-stone"
          >
            Created {formatDateTime(election.createdAt)}
            {election.createdBy ? ` by ${election.createdBy.firstName} ${election.createdBy.lastName}` : ""}
            {" · "}
            Last updated {formatDateTime(election.updatedAt)}
          </motion.div>
        </>
      )}

      <DeleteConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        isPending={deleteMutation.isPending}
        title={`Delete "${election?.title ?? ""}"?`}
        description="This removes the election from every list. Any categories, nominees, and vote history stay on record but will no longer be publicly reachable."
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
