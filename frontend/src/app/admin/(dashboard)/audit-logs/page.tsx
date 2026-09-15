"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { useAuth } from "@/components/admin/auth-provider";
import { listAuditLogs } from "@/lib/api/audit-logs";
import { formatDateTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [filters, setFilters] = useState({ action: "", entityType: "", entityId: "", actorUserId: "" });
  const query = useQuery({ queryKey: ["audit-logs", { page, ...filters }], queryFn: () => listAuditLogs({ page, limit: 20, ...filters }), enabled: user?.role === "super_admin", placeholderData: keepPreviousData });

  if (user?.role !== "super_admin") return <div className="p-6 md:p-10"><ErrorState title="Super admin access required" description="Audit logs are restricted to super admin accounts." /></div>;
  const logs = query.data?.auditLogs ?? [];
  function applyFilters() { setPage(1); setFilters({ action, entityType, entityId, actorUserId }); }
  function clearFilters() { setAction(""); setEntityType(""); setEntityId(""); setActorUserId(""); setFilters({ action: "", entityType: "", entityId: "", actorUserId: "" }); setPage(1); }

  return <div className="p-6 md:p-10"><div><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Oversight</p><h1 className="mt-2 font-display text-display-md text-cream">Audit logs</h1><p className="mt-2 text-stone">Trace platform actions performed by administrators.</p></div><div className="surface-card mt-8 overflow-hidden"><div className="grid gap-3 border-b border-border/50 p-4 sm:grid-cols-2 lg:grid-cols-4"><Input value={actorUserId} onChange={(event) => setActorUserId(event.target.value)} placeholder="Actor user ID" /><Input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Action" /><Input value={entityType} onChange={(event) => setEntityType(event.target.value)} placeholder="Entity type" /><Input value={entityId} onChange={(event) => setEntityId(event.target.value)} placeholder="Entity ID" /><div className="flex gap-2 sm:col-span-2 lg:col-span-4"><Button onClick={applyFilters}><Search className="h-4 w-4" />Apply filters</Button><Button variant="ghost" onClick={clearFilters}>Clear</Button></div></div>{query.isLoading ? <Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Metadata</TableHead></TableRow></TableHeader><TableSkeletonRows rows={8} columns={5} /></Table> : query.isError ? <ErrorState title="Audit logs unavailable" description="We couldn’t load the audit trail." onRetry={() => query.refetch()} /> : logs.length === 0 ? <EmptyState icon={ScrollText} title="No audit entries" description="No actions match the current filters." /> : <Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Metadata</TableHead></TableRow></TableHeader><TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell className="whitespace-nowrap text-xs text-stone">{formatDateTime(log.createdAt)}</TableCell><TableCell className="text-sm text-cream">{log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : log.actorUserId}</TableCell><TableCell className="font-mono text-xs text-champagne">{log.action}</TableCell><TableCell><p className="text-xs text-cream">{log.entityType}</p><p className="max-w-40 truncate font-mono text-[11px] text-stone">{log.entityId}</p></TableCell><TableCell className="max-w-64 truncate font-mono text-[11px] text-stone">{log.metadata ? JSON.stringify(log.metadata) : "-"}</TableCell></TableRow>)}</TableBody></Table>}{query.data && query.data.pagination.total > 0 && <PaginationControls pagination={query.data.pagination} onPageChange={setPage} onLimitChange={() => setPage(1)} itemLabel="audit entries" />}</div></div>;
}
