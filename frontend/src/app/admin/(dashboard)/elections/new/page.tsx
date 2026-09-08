"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ElectionForm } from "@/components/admin/elections/election-form";
import { createElection } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import { fromDateTimeLocalValue } from "@/lib/utils";
import type { ElectionFormValues } from "@/lib/validation/election";

export default function NewElectionPage() {
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ElectionFormValues) =>
      createElection({
        title: values.title,
        description: values.description?.trim() || undefined,
        startDate: fromDateTimeLocalValue(values.startDate),
        endDate: fromDateTimeLocalValue(values.endDate),
        pricePerVote: values.pricePerVote,
      }),
    onSuccess: (election) => {
      toast.success("Election created", {
        description: "It's saved as a draft — add categories and nominees before activating it.",
      });
      router.push(`/admin/elections/${election.id}/edit`);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't create election", { description: message });
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

        <h1 className="mt-4 font-display text-display-md text-cream">Create a new election</h1>
        <p className="mt-2 max-w-xl text-stone">
          Every new election starts as a draft. You&apos;ll be able to add categories and
          nominees before opening it up to voters.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="surface-card mt-8 max-w-2xl p-6 md:p-8"
      >
        <ElectionForm
          mode="create"
          isSubmitting={isPending}
          onSubmit={(values) => mutate(values)}
          onCancel={() => router.push("/admin/elections")}
        />
      </motion.div>
    </div>
  );
}
