import { Skeleton } from "@/components/ui/skeleton";

export default function MatchesLoading() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="mb-6 h-[72px] rounded-card" />
      <Skeleton className="mb-8 h-12 w-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] rounded-card lg:h-[92px]" />
        ))}
      </div>
    </div>
  );
}
