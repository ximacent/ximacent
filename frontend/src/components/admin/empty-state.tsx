import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-5 w-5 text-stone" />
      </span>
      <h3 className="font-display text-lg text-cream">{title}</h3>
      {description && <p className="max-w-sm text-sm text-stone">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
