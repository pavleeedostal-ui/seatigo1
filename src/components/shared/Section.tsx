import { cn } from "@/lib/utils";

/** Sections are separated by space, not by boxes. `tone="muted"` is the only alternate background. */
export function Section({
  className,
  children,
  id,
  tone = "plain",
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
  tone?: "plain" | "muted";
}) {
  return (
    <section
      id={id}
      className={cn("py-12 sm:py-16 lg:py-20", tone === "muted" && "bg-background", className)}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div>
        <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-xl text-[15px] text-ink-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
