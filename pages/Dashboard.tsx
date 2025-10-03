import LiveQueuePanel from "../components/LiveQueuePanel";
import RecentActivityPanel from "../components/RecentActivityPanel";
import AggregateMetricsPanel from "../components/AggregateMetricsPanel";
import mockCalls from "../data/mockCalls";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <LiveQueuePanel queue={mockCalls.liveQueue} />
          <RecentActivityPanel recent={mockCalls.recentActivity} />
        </div>
        <AggregateMetricsPanel metrics={mockCalls.metrics} />
      </div>
    </div>
  );
}
