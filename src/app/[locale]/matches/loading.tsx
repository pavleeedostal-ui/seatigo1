import { HeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function MatchesLoading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="container-page pb-16 pt-8 sm:pt-10">
        <Skeleton className="mb-6 h-[60px] rounded-card" />
        <Skeleton className="mb-8 h-12 w-full" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-card lg:h-[104px]" />
          ))}
        </div>
      </div>
    </>
  );
}
