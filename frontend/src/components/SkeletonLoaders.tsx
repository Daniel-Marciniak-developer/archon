import { cn } from "@/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/5", className)}
      {...props}
    />
  );
}

const ProjectCardSkeleton = () => (
  <div className="flex items-center space-x-4 rounded-lg border border-white/10 bg-[#17171A] p-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2 py-1">
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-4 w-1/2 rounded" />
    </div>
    <Skeleton className="h-8 w-24 rounded-lg" />
  </div>
);

export { Skeleton, ProjectCardSkeleton };
