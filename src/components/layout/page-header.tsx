import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-text-muted">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-2xl font-semibold text-text md:text-3xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}
