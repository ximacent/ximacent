"use client";

import Image from "next/image";
import { Eye, Pencil, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mediaUrl } from "@/lib/utils";
import type { Nominee } from "@/lib/api/types";

export function NomineesTableHeader({ showCategory }: { showCategory: boolean }) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Nominee</TableHead>
        <TableHead className="hidden sm:table-cell">Code</TableHead>
        {showCategory && <TableHead className="hidden md:table-cell">Category</TableHead>}
        <TableHead className="hidden lg:table-cell">Bio</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function NomineesTable({
  nominees,
  showCategory,
  onEdit,
  onDelete,
  onView,
}: {
  nominees: Nominee[];
  /** Show the "Category" column — only relevant on the global, cross-category list. */
  showCategory: boolean;
  onEdit: (nominee: Nominee) => void;
  onDelete: (nominee: Nominee) => void;
  onView: (nominee: Nominee) => void;
}) {
  return (
    <Table>
      <NomineesTableHeader showCategory={showCategory} />
      <TableBody>
        {nominees.map((nominee) => {
          const imageSrc = mediaUrl(nominee.imageUrl);
          return (
            <TableRow key={nominee.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-border/60 bg-surface-elevated">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={`${nominee.name} profile`}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound className="h-4 w-4 text-stone/40" />
                      </div>
                    )}
                  </div>
                  <span className="line-clamp-1 max-w-[160px] font-medium text-cream">
                    {nominee.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-stone">{nominee.code}</TableCell>
              {showCategory && (
                <TableCell className="hidden md:table-cell text-stone">
                  {nominee.category?.name ?? "—"}
                </TableCell>
              )}
              <TableCell className="hidden lg:table-cell max-w-[280px] text-stone">
                <span className="line-clamp-1">{nominee.bio || "—"}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`View ${nominee.name}`}
                    onClick={() => onView(nominee)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Edit ${nominee.name}`}
                    onClick={() => onEdit(nominee)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Delete ${nominee.name}`}
                    className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"
                    onClick={() => onDelete(nominee)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
