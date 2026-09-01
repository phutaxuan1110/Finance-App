import { SnakeMascot } from "@/components/mascot/SnakeMascot";
import type { MascotExpression } from "@/types";

export function EmptyState({
  title,
  description,
  expression = "sleeping",
  action,
}: {
  title: string;
  description: string;
  expression?: MascotExpression;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <SnakeMascot expression={expression} size={84} />
      <p className="mt-4 font-medium">{title}</p>
      <p className="text-sm text-text-muted mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
