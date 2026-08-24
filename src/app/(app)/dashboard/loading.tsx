export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-8">
      <div className="bg-muted h-8 w-64 animate-pulse rounded" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="bg-muted h-36 animate-pulse rounded-xl" key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-muted h-64 animate-pulse rounded-xl" />
        <div className="bg-muted h-64 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}
