"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ListChecks, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/lib/api/types";

export function CategoriesTableHeader({ showElection }: { showElection: boolean }) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Category</TableHead>
        {showElection && <TableHead className="hidden md:table-cell">Election</TableHead>}
        <TableHead className="hidden sm:table-cell">Order</TableHead>
        <TableHead className="hidden lg:table-cell">Description</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function CategoriesTable({
  categories,
  showElection,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  reorderPendingId,
}: {
  categories: Category[];
  /** Show the "Election" column — only relevant on the global, cross-election list. */
  showElection: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  /** Present only in the election-scoped panel, where reordering makes sense. */
  onMoveUp?: (category: Category, index: number) => void;
  onMoveDown?: (category: Category, index: number) => void;
  reorderPendingId?: string | null;
}) {
  const canReorder = Boolean(onMoveUp && onMoveDown);

  return (
    <Table>
      <CategoriesTableHeader showElection={showElection} />
      <TableBody>
        {categories.map((category, index) => (
          <TableRow key={category.id}>
            <TableCell>
              <Link
                href={`/admin/categories/${category.id}`}
                className="focus-ring block max-w-[220px] rounded-sm font-medium text-cream hover:text-champagne"
              >
                <span className="line-clamp-1">{category.name}</span>
              </Link>
            </TableCell>
            {showElection && (
              <TableCell className="hidden md:table-cell text-stone">
                {category.election?.title ?? "—"}
              </TableCell>
            )}
            <TableCell className="hidden sm:table-cell">
              {canReorder ? (
                <div className="flex items-center gap-1">
                  <span className="w-5 text-center text-stone">{category.displayOrder}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Move ${category.name} up`}
                    disabled={index === 0 || reorderPendingId === category.id}
                    onClick={() => onMoveUp?.(category, index)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Move ${category.name} down`}
                    disabled={index === categories.length - 1 || reorderPendingId === category.id}
                    onClick={() => onMoveDown?.(category, index)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <span className="text-stone">{category.displayOrder}</span>
              )}
            </TableCell>
            <TableCell className="hidden lg:table-cell max-w-[280px] text-stone">
              <span className="line-clamp-1">{category.description || "—"}</span>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="icon" asChild aria-label={`Manage nominees in ${category.name}`}>
                  <Link href={`/admin/categories/${category.id}`}>
                    <ListChecks className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Edit ${category.name}`}
                  onClick={() => onEdit(category)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Delete ${category.name}`}
                  className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"
                  onClick={() => onDelete(category)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
