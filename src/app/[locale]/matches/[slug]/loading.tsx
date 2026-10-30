import { HeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function MatchDetailLoading() {
  return (
    <>
      <HeaderSkeleton className="[&>div]:pb-40" />
      <div className="container-page pb-16 pt-10 sm:pt-14">
        <Skeleton className="mb-3 h-12 w-80 max-w-full" />
        <Skeleton className="mb-10 h-4 w-96 max-w-full" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
          <Skeleton className="h-72 w-full rounded-card" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px] rounded-card" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
