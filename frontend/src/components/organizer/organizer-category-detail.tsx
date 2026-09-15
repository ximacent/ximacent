"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/admin/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listElections } from "@/lib/api/elections";
import { getMyOrganizerStatus } from "@/lib/api/organizers";
import { CategoryDetailClient } from "@/app/admin/(dashboard)/categories/[id]/category-detail-client";
import { useAuth } from "@/components/admin/auth-provider";

export function OrganizerCategoryDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const statusQuery = useQuery({ queryKey: ["organizer-status"], queryFn: getMyOrganizerStatus, staleTime: 30_000 });
  const electionsQuery = useQuery({ queryKey: ["organizer-elections", user?.id, "category-detail"], queryFn: () => listElections({ createdById: user!.id, limit: 100 }), enabled: Boolean(user?.id), staleTime: 30_000 });
  if (statusQuery.isLoading || electionsQuery.isLoading) return <div className="p-6 md:p-10"><Skeleton className="h-8 w-64" /><Skeleton className="mt-8 h-96 max-w-4xl" /></div>;
  if (statusQuery.isError || electionsQuery.isError) return <div className="p-6 md:p-10"><ErrorState title="Category unavailable" description="We couldn’t confirm your organizer access." onRetry={() => { statusQuery.refetch(); electionsQuery.refetch(); }} /></div>;
  if (!statusQuery.data?.canCreateElection) return <div className="p-6 md:p-10"><ErrorState title="Category management is locked" description="Your organizer application must be approved and verified before you can manage categories." /></div>;
  const allowedElectionIds = (electionsQuery.data?.elections ?? []).map((election) => election.id);
  return <CategoryDetailClient id={id} basePath="/organizer/dashboard" electionDetailSuffix="" allowedElectionIds={allowedElectionIds} />;
}