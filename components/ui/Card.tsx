import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(15,23,18,0.04),0_8px_24px_-12px_rgba(15,23,18,0.08)] ${className}`}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
