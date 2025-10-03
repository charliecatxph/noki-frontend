type Metrics = {
  totalCallsToday: number;
  totalCallsThisWeek: number;
  averageResponseTimeMinutes: number;
};

export default function AggregateMetricsPanel({
  metrics,
}: {
  metrics: Metrics;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4">Aggregate Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold">{metrics.totalCallsToday}</div>
          <div className="text-gray-500 text-sm">Calls Today</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold">{metrics.totalCallsThisWeek}</div>
          <div className="text-gray-500 text-sm">Calls This Week</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold">
            {metrics.averageResponseTimeMinutes} min
          </div>
          <div className="text-gray-500 text-sm">Avg. Response Time</div>
        </div>
      </div>
    </div>
  );
}
