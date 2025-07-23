import { Skeleton } from "components/SkeletonLoaders";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const ReportPageSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header with overall score */}
      <Card className="border-white/10 bg-[#17171A]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-white/10 bg-[#17171A]">
            <CardHeader>
              <Skeleton className="h-5 w-32 rounded" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Issues List */}
      <Card className="border-white/10 bg-[#17171A]">
        <CardHeader>
          <Skeleton className="h-6 w-40 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 rounded-lg border border-white/10 p-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPageSkeleton;
