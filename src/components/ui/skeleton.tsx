import { cn } from "@/lib/utils";

/** The blue title band, held in place while a page loads, so it never flashes paper. */
function HeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-album", className)}>
      <div className="container-page pb-12 pt-8 sm:pb-14 sm:pt-10">
        <div className="h-14 w-3/4 max-w-xl animate-pulse rounded-[8px] bg-white/15 sm:h-20" />
        <div className="mt-4 h-4 w-2/3 max-w-md animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-card bg-paper-deep", className)}
      {...props}
    />
  );
}

export { Skeleton, HeaderSkeleton };
