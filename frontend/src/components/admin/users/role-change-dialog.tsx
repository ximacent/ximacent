"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/types";
import { changeUserRole } from "@/lib/api/users";
import type { UserRole, UserSummary } from "@/lib/api/types";

const roles: Array<{ value: UserRole; label: string }> = [
  { value: "voter", label: "Voter" },
  { value: "organizer", label: "Organizer" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super admin" },
];

export function RoleChangeDialog({ user, open, onOpenChange }: { user: UserSummary; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<UserRole>(user.role);
  const mutation = useMutation({
    mutationFn: () => changeUserRole(user.id, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role updated", { description: `${user.firstName} ${user.lastName} is now ${roles.find((item) => item.value === role)?.label}.` }); onOpenChange(false); },
    onError: (error) => toast.error("Couldn’t update role", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });
  return <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Change user role</DialogTitle><DialogDescription>Update access for {user.firstName} {user.lastName}. This action is restricted to super admins.</DialogDescription></DialogHeader><div className="space-y-2"><label htmlFor="role-change" className="text-sm font-medium text-cream">Role</label><Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={mutation.isPending}><SelectTrigger id="role-change"><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button><Button type="button" disabled={mutation.isPending || role === user.role} onClick={() => mutation.mutate()}>{mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</> : <><ShieldCheck className="h-4 w-4" />Update role</>}</Button></div></DialogContent></Dialog>;
}
