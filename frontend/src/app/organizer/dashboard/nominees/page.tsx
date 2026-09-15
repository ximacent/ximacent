"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { NomineeFilters } from "@/components/admin/nominees/nominee-filters";
import { NomineeFormDialog } from "@/components/admin/nominees/nominee-form-dialog";
import { NomineeDetailDialog } from "@/components/admin/nominees/nominee-detail-dialog";
import { NomineesTable, NomineesTableHeader } from "@/components/admin/nominees/nominees-table";
import { getMyOrganizerStatus } from "@/lib/api/organizers";
import { listElections } from "@/lib/api/elections";
import { listCategories } from "@/lib/api/categories";
import { deleteNominees, listNominees } from "@/lib/api/nominees";
import { ApiError } from "@/lib/api/types";
import type { Nominee } from "@/lib/api/types";
import { useAuth } from "@/components/admin/auth-provider";

const CODE_PATTERN = /^[A-Za-z]{3}\d+$/;

export default function OrganizerNomineesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<"create" | Nominee | null>(null);
  const [viewing, setViewing] = useState<Nominee | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Nominee | null>(null);
  const statusQuery = useQuery({ queryKey: ["organizer-status"], queryFn: getMyOrganizerStatus, staleTime: 30_000 });
  const electionsQuery = useQuery({ queryKey: ["organizer-elections", user?.id, "nominee-options"], queryFn: () => listElections({ createdById: user!.id, limit: 100 }), enabled: Boolean(user?.id), staleTime: 30_000 });
  const elections = electionsQuery.data?.elections ?? [];
  const ownedElectionIds = useMemo(() => new Set(elections.map((election) => election.id)), [elections]);
  const categoriesQuery = useQuery({ queryKey: ["organizer-categories", user?.id, "nominee-options"], queryFn: () => listCategories({ limit: 200 }), enabled: Boolean(statusQuery.data?.canCreateElection), staleTime: 30_000 });
  const categories = (categoriesQuery.data?.categories ?? []).filter((category) => category.election?.id && ownedElectionIds.has(category.election.id));
  const filteredCategories = categories.filter((category) => !electionId || category.election?.id === electionId);
  const isCodeSearch = CODE_PATTERN.test(search.trim());
  const nomineesQuery = useQuery({ queryKey: ["organizer-nominees", { categoryId, search }], queryFn: () => listNominees({ limit: 200, categoryId, name: search && !isCodeSearch ? search : undefined, code: search && isCodeSearch ? search : undefined }), enabled: Boolean(statusQuery.data?.canCreateElection), placeholderData: keepPreviousData });
  const nominees = (nomineesQuery.data?.nominees ?? []).filter((nominee) => nominee.category?.election?.id && ownedElectionIds.has(nominee.category.election.id));
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNominees([id]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["organizer-nominees"] }); queryClient.invalidateQueries({ queryKey: ["admin-category-nominees"] }); toast.success("Nominee deleted"); setPendingDelete(null); },
    onError: (error) => toast.error("Couldn’t delete nominee", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });

  if (statusQuery.isLoading || electionsQuery.isLoading || categoriesQuery.isLoading) return <div className="p-6 md:p-10"><div className="surface-card h-40 animate-pulse" /></div>;
  if (statusQuery.isError || electionsQuery.isError || categoriesQuery.isError) return <div className="p-6 md:p-10"><ErrorState title="Nominees unavailable" description="We couldn’t load your organizer elections and categories." onRetry={() => { statusQuery.refetch(); electionsQuery.refetch(); categoriesQuery.refetch(); }} /></div>;
  if (!statusQuery.data?.canCreateElection) return <div className="p-6 md:p-10"><div className="surface-card max-w-2xl p-6 md:p-8"><h1 className="font-display text-display-md text-cream">Nominees are locked</h1><p className="mt-3 text-sm leading-relaxed text-stone">Your organizer application must be approved and your account verified before you can manage nominees.</p><Button asChild className="mt-6"><a href="/organizer/dashboard/profile">Open profile & verification</a></Button></div></div>;

  return <div className="p-6 md:p-10"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Organizer workspace</p><h1 className="mt-2 font-display text-display-md text-cream">Nominees</h1><p className="mt-2 text-stone">Manage nominees inside your own election categories.</p></div><Button disabled={!categoryId} title={!categoryId ? "Select an election and category first" : undefined} onClick={() => setFormState("create")}><Plus className="h-4 w-4" />New nominee</Button></div><div className="surface-card mt-8 overflow-hidden"><NomineeFilters name={search} onNameChange={setSearch} categoryId={categoryId} onCategoryChange={setCategoryId} electionId={electionId} onElectionChange={(value) => { setElectionId(value); setCategoryId(undefined); }} elections={elections} categories={filteredCategories} hasActiveFilters={Boolean(search || electionId || categoryId)} onReset={() => { setSearch(""); setElectionId(undefined); setCategoryId(undefined); }} />{nomineesQuery.isLoading ? <Table><NomineesTableHeader showCategory /><TableSkeletonRows rows={8} columns={5} /></Table> : nomineesQuery.isError ? <ErrorState description="We couldn’t load nominees. Check your connection and try again." onRetry={() => nomineesQuery.refetch()} /> : nominees.length === 0 ? <EmptyState icon={UserRound} title="No nominees yet" description={categoryId ? "Add the first nominee to this category." : "Select one of your elections and categories to view nominees."} /> : <NomineesTable nominees={nominees} showCategory={!categoryId} onEdit={(nominee) => setFormState(nominee)} onDelete={setPendingDelete} onView={setViewing} />}</div>{formState && <NomineeFormDialog open onOpenChange={(open) => !open && setFormState(null)} context={{ kind: "category", categoryId: formState === "create" ? categoryId ?? "" : formState.category?.id ?? "", categoryName: formState === "create" ? filteredCategories.find((category) => category.id === categoryId)?.name ?? "" : formState.category?.name ?? "" }} nominee={formState === "create" ? undefined : formState} />}{viewing && <NomineeDetailDialog nominee={viewing} open onOpenChange={(open) => !open && setViewing(null)} />}{pendingDelete && <DeleteConfirmDialog open onOpenChange={(open) => !open && setPendingDelete(null)} isPending={deleteMutation.isPending} title={`Delete “${pendingDelete.name}”?`} description="This removes the nominee from the public site. Vote history stays on record." onConfirm={() => deleteMutation.mutate(pendingDelete.id)} />}</div>;
}