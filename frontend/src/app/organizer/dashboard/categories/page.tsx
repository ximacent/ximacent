"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { CategoryFilters } from "@/components/admin/categories/category-filters";
import { CategoryFormDialog } from "@/components/admin/categories/category-form-dialog";
import { CategoriesTable, CategoriesTableHeader } from "@/components/admin/categories/categories-table";
import { getMyOrganizerStatus } from "@/lib/api/organizers";
import { listElections } from "@/lib/api/elections";
import { deleteCategories, listCategories } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import type { Category } from "@/lib/api/types";
import { useAuth } from "@/components/admin/auth-provider";

export default function OrganizerCategoriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [formState, setFormState] = useState<"create" | Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const statusQuery = useQuery({ queryKey: ["organizer-status"], queryFn: getMyOrganizerStatus, staleTime: 30_000 });
  const electionsQuery = useQuery({ queryKey: ["organizer-elections", user?.id, "category-options"], queryFn: () => listElections({ createdById: user!.id, limit: 100 }), enabled: Boolean(user?.id), staleTime: 30_000 });
  const elections = electionsQuery.data?.elections ?? [];
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["organizer-categories", { electionId, name }], queryFn: () => listCategories({ limit: 200, electionId, name: name || undefined }), enabled: Boolean(statusQuery.data?.canCreateElection), placeholderData: keepPreviousData });

  const ownedElectionIds = useMemo(() => new Set(elections.map((election) => election.id)), [elections]);
  const categories = (data?.categories ?? []).filter((category) => category.election?.id && ownedElectionIds.has(category.election.id));
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategories([id]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["organizer-categories"] }); queryClient.invalidateQueries({ queryKey: ["organizer-election-categories"] }); toast.success("Category deleted"); setPendingDelete(null); },
    onError: (error) => toast.error("Couldn’t delete category", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });

  if (statusQuery.isLoading || electionsQuery.isLoading) return <div className="p-6 md:p-10"><div className="surface-card h-40 animate-pulse" /></div>;
  if (statusQuery.isError || electionsQuery.isError) return <div className="p-6 md:p-10"><ErrorState title="Categories unavailable" description="We couldn’t load your organizer access or elections." onRetry={() => { statusQuery.refetch(); electionsQuery.refetch(); }} /></div>;
  if (!statusQuery.data?.canCreateElection) return <LockedManagement />;

  return <div className="p-6 md:p-10"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Organizer workspace</p><h1 className="mt-2 font-display text-display-md text-cream">Categories</h1><p className="mt-2 text-stone">Manage categories across your own elections.</p></div><Button disabled={!electionId} title={!electionId ? "Select one of your elections first" : undefined} onClick={() => setFormState("create")}><Plus className="h-4 w-4" />New category</Button></div><div className="surface-card mt-8 overflow-hidden"><CategoryFilters name={name} onNameChange={setName} electionId={electionId} onElectionChange={setElectionId} elections={elections} hasActiveFilters={Boolean(name || electionId)} onReset={() => { setName(""); setElectionId(undefined); }} />{isLoading ? <Table><CategoriesTableHeader showElection /><TableSkeletonRows rows={8} columns={5} /></Table> : isError ? <ErrorState description="We couldn’t load categories. Check your connection and try again." onRetry={() => refetch()} /> : categories.length === 0 ? <EmptyState icon={Layers} title="No categories yet" description={electionId ? "Add the first category to this election." : "Select one of your elections to view its categories."} /> : <CategoriesTable categories={categories} showElection onEdit={(category) => setFormState(category)} onDelete={setPendingDelete} detailBasePath="/organizer/dashboard/categories" />}</div>{formState && <CategoryFormDialog open onOpenChange={(open) => !open && setFormState(null)} electionId={formState === "create" ? electionId ?? "" : formState.election?.id ?? ""} category={formState === "create" ? undefined : formState} />}{pendingDelete && <DeleteConfirmDialog open onOpenChange={(open) => !open && setPendingDelete(null)} isPending={deleteMutation.isPending} title={`Delete “${pendingDelete.name}”?`} description="Nominees in this category will no longer be publicly reachable." onConfirm={() => deleteMutation.mutate(pendingDelete.id)} />}</div>;
}

function LockedManagement() { return <div className="p-6 md:p-10"><div className="surface-card max-w-2xl p-6 md:p-8"><h1 className="font-display text-display-md text-cream">Categories are locked</h1><p className="mt-3 text-sm leading-relaxed text-stone">Your organizer application must be approved and your account verified before you can manage categories. Open Profile & verification to see what remains.</p><Button asChild className="mt-6"><a href="/organizer/dashboard/profile">Open profile & verification</a></Button></div></div>; }