import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveResultsLink({ slug }: { slug: string }) {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="border-champagne/35 bg-ink/35 text-champagne shadow-soft hover:border-champagne/60 hover:bg-champagne/10 hover:text-champagne-soft active:bg-champagne/15"
    >
      <Link href={`/elections/${slug}/results`}>
        <Trophy className="h-4 w-4" />
        View live results
      </Link>
    </Button>
  );
}