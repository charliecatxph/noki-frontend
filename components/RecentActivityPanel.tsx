type RecentCall = {
  studentName: string;
  class: string;
  timeRequested: string;
  timeCompleted: string;
  responseTimeMinutes: number;
};

export default function RecentActivityPanel({
  recent,
}: {
  recent: RecentCall[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
      {recent.length === 0 ? (
        <div className="text-gray-500">No recent activity.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {recent.map((call, i) => (
            <li
              key={i}
              className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {call.studentName}
                </div>
                <div className="text-gray-500 text-sm">{call.class}</div>
                <div className="text-gray-400 text-xs">
                  Requested: {call.timeRequested}
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-1">
                <div className="text-gray-700 text-sm">
                  Completed: {call.timeCompleted}
                </div>
                <div className="text-xs text-gray-500">
                  Response: {call.responseTimeMinutes} min
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
