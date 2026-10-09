import { Skeleton } from "@/components/ui/skeleton";

export default function MatchDetailLoading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="border-b border-border pb-10">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-12 w-full max-w-lg" />
        <Skeleton className="mt-5 h-4 w-72 max-w-full" />
        <Skeleton className="mt-2 h-4 w-56 max-w-full" />
      </div>
      <div className="mt-12">
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="mb-8 h-4 w-80 max-w-full" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
          <Skeleton className="mx-auto h-72 w-full max-w-md rounded-card" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px] rounded-card" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
